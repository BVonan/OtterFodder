const express = require("express");
const mysql = require('mysql');
const fileUpload = require('express-fileupload');
const bcrypt = require('bcrypt');
const cloudinary = require('cloudinary').v2;
const saltRounds = 10;
const path = require('path');
const fs = require('fs');
const session = require('express-session');
const app = express();
const pool = dbConnection();
const distance = require('google-distance-matrix');
distance.key('AIzaSyDbNbWHhCVBg4ie6BreHvT4T36mhXtQq6A');
distance.units('imperial');

const bodyParser = require("body-parser");

// Use body-parser middleware to parse JSON payloads
app.use(bodyParser.json());



app.use(fileUpload());
app.use(express.static(__dirname + '/public'));
app.set("view engine", "ejs");
app.use(express.static("public"));
// needed to add this to parse forms into post 
app.use(express.urlencoded({ extended: true }));


app.use(session({
    secret: 'your-session-secret',
    resave: false,
    saveUninitialized: true,
    cookie: { maxAge: 60 * 60 * 1000 } // 1 hour
}));

//routes
app.get('/', (req, res) => {
    res.render('home')
});

// hash pass (brcypt)
// no dupes emails
// minim req for pass and email 

// render new author page 
app.get('/user/new', (req, res) => {
    res.render('newUser')
});

// post info to db 
app.post('/user/new', async (req, res) => {
    const email = req.body.email;
    const phone = req.body.phone;
    const password = req.body.password;

    const email_checker = "Select * from Login_info where email=?";
    const sql_checker = [email];
    let checker_obj = await executeSQL(email_checker, sql_checker);

    if (checker_obj.length > 0) {
        res.render("newUser", { "error2": "Email taken. Please use another" })
    } else {
        bcrypt.hash(password, saltRounds, async function(err, hash) {
            // Store hash in your password DB.
            console.log(hash);



            // change for no dupes 
            const sql = "INSERT INTO Login_info (email, phone, password) VALUES (?, ?, ?)";


            const params = [email, phone, hash];

            await executeSQL(sql, params);

            const sqluser = "Insert into User (login_Id) values (last_insert_id())";

            let newUser = await executeSQL(sqluser);
            console.log(newUser);
        });



        res.render("login");
    }


});

// render new quote page, and get authors to populate drop down 
app.get('/user/login', async (req, res) => {

    res.render("login");

});



app.post('/user/login/profile', async (req, res) => {
    const email = req.body.email;
    const password = req.body.password;
    const login_Id = req.body.login_Id;
    let passwordHash = "";



    const sql = `SELECT * FROM Login_info WHERE email = ? `;
    let rows = await executeSQL(sql, [email]);




    if (rows.length > 0) {
        passwordHash = rows[0].password;
        console.log("passwordHash: " + passwordHash);
    }
    const match = await bcrypt.compare(password, passwordHash);
    console.log(match);

    if (match) {
        authenticated = true;
        const params = [email, password]
        const info = await executeSQL(sql, params, [login_Id]);
        console.log("LOgin ID:" + info[0].login_Id);

        const sql2 = `SELECT * FROM User WHERE login_Id = ? `;
        let rows2 = await executeSQL(sql2, [info[0].login_Id]);



        req.session.login_Id = info[0].login_Id;
        console.log("OUTPUT K: " + rows2.length);
        console.log(rows2);

        // if(rows2[0].zip==null){

        //   res.render('editUser', {info},[login_Id]);
        // }
        res.render('decision', { info, rows2 })


    }
    else {
        res.render('login', { "error": "Wrong Credentials" });
    }


});

//logout
app.get('/logout', (req, res) => {
    req.session.destroy();
    res.redirect('/');
});

app.get('/editUser', async (req, res) => {

    const login_Id = req.query.login_Id;
    console.log("login: " + login_Id);

    const sql = "SELECT User.*, Login_info.* FROM User INNER JOIN Login_info ON User.login_id = Login_info.login_id WHERE Login_info.login_id = ?";

    const params = [login_Id];
    let info = await executeSQL(sql, params);
    console.log(info[0]);
    if (!info[0]) {
        info = {
            login_Id: null,
            name: null,
            email: null,
            phone: null,
            bio: null,
            sex: null,
            location: null
        };
    } else {
        info = info[0];
    }

    res.render('editUser', { info });
});

app.post('/editUser', async (req, res) => {
    const login_Id = req.body.login_Id;
    const name = req.body.name;
    const bio = req.body.bio;
    const zip = req.body.location;
    const sex = req.body.sex;
    const song = req.body.song;



    console.log("LOGIN///////" + login_Id)



    const key = "AIzaSyCAcLLLMNM7NzrD1O4nlAT1LhCDrwNMWps";

    const api = `https://www.googleapis.com/youtube/v3/search?part=snippet&key=${key}&type=video&part=snippet&maxResults=1&q=${song}&videoEmbeddable=true`;

    const response = await fetch(api);
    const data = await response.json();
    const videoId = data.items[0].id.videoId;
    console.log(videoId);

    /////////////////////////////////////////////////////////////////////

    let image_1_url;
    let image_1 = req.files && req.files.image_1;

    if (image_1) {
        try {
            const tempFilePath = path.join(__dirname, '/public/', image_1.name);
            await image_1.mv(tempFilePath);
            const result = await cloudinary.uploader.upload(tempFilePath);
            image_1_url = result.secure_url;
            fs.unlinkSync(tempFilePath); // delete the temporary file
        } catch (error) {
            console.log('Error uploading image:', error);
            return res.status(500).send('Error uploading image');
        }
    } else {
        // If null then get the previous image from db
        // Retrieves the value of image from db to populate later
        const image_query = "SELECT * FROM User WHERE login_Id= ?";
        const image_params = [login_Id];
        const image_info = await executeSQL(image_query, image_params);
        const image_obj = image_info[0];
        console.log(image_obj.image_1);
        image_1_url = image_obj.image_1;
    }
    ///////////////////////////////////////////////////////////////
    let image_2_url;
    let image_2 = req.files && req.files.image_2;

    if (image_2) {
        try {
            const tempFilePath2 = path.join(__dirname, '/public/', image_2.name);
            await image_2.mv(tempFilePath2);
            const result2 = await cloudinary.uploader.upload(tempFilePath2);
            image_2_url = result2.secure_url;
            fs.unlinkSync(tempFilePath2); // delete the temporary file
        } catch (error) {
            console.log('Error uploading image:', error);
            return res.status(500).send('Error uploading image');
        }
    } else {
        const image2_query = "SELECT * FROM User WHERE login_Id= ?";
        const image2_params = [login_Id];
        const image2_info = await executeSQL(image2_query, image2_params);
        const image2_obj = image2_info[0];
        image_2_url = image2_obj.image_2;
    }
    ////////////////////////////////////////////////////////////////
    let image_3_url;
    let image_3 = req.files && req.files.image_3;

    if (image_3) {
        try {
            const tempFilePath3 = path.join(__dirname, '/public/', image_3.name);
            await image_3.mv(tempFilePath3);
            const result3 = await cloudinary.uploader.upload(tempFilePath3);
            image_3_url = result3.secure_url;
            fs.unlinkSync(tempFilePath3); // delete the temporary file
        } catch (error) {
            console.log('Error uploading image:', error);
            return res.status(500).send('Error uploading image');
        }
    } else {
        // If null then get the previous image from db
        // Retrieves the value of image from db to populate later
        const image3_query = "SELECT * FROM User WHERE login_Id= ?";
        const image3_params = [login_Id];
        const image3_info = await executeSQL(image3_query, image3_params);
        const image3_obj = image3_info[0];
        console.log(image3_obj.image_3);
        image_3_url = image3_obj.image_3;
    }
    //////////////////////////////////////////////////////////////////////////
    console.log('Received data:', req.body);

    const sql =
        'UPDATE User SET music=?, firstName = ?, bio = ?, zip = ?, sex = ?, image_1 = ? , image_2 = ?, image_3 = ? WHERE login_Id = ?';
    const params = [videoId, name, bio, zip, sex, image_1_url, image_2_url, image_3_url, login_Id];

    let info = await executeSQL(sql, params);
    info = req.body;
    console.log('Update result:', info);
    res.render('displayUser2', { info, "img1": image_1_url, "img2": image_2_url, "img3": image_3_url });

});




///////
app.get('/displayUser', async (req, res) => {
    const login_Id = req.query.login_Id;


    const sql = "SELECT User.*, Login_info.* FROM User INNER JOIN Login_info ON User.login_id = Login_info.login_id WHERE Login_info.login_id = ?";


    const params = [login_Id];


    const info = await executeSQL(sql, params);

    res.render('displayUser', { info });

});

// function for inserting into db 
async function handleSwipe(swiper_id, swiped_id) {
    let swiped = true;

    console.log("SWIPE ID: " + swiped_id + " " + "SWIPER ID " + swiper_id);

    const checkSQL = "select * FROM Matches WHERE swiper_id = ? AND swiped_id = ?";

    const existingSwipe = await executeSQL(checkSQL, [swiper_id, swiped_id]);

    if (existingSwipe.length == 0) {
        const sql = "INSERT INTO Matches (swiper_id, swiped_id, swiped) VALUES (?, ?,?)";
        console.log("Inserted into match table");

        const params = [swiper_id, swiped_id, swiped];
        await executeSQL(sql, params);
    }
}

// gets the users from db 
app.get("/shellstack", async function(req, res) {
    const login_Id = req.session.login_Id;

    if (!login_Id) {
        res.redirect('user/login');
        return;
    }

    //final query 
    const sql = "SELECT User.* FROM User WHERE User.login_Id NOT IN ( SELECT Matches.swiped_id FROM Matches WHERE Matches.swiper_id = ? ) AND User.login_Id <>?";


    const users = await executeSQL(sql, [login_Id, login_Id]);

    res.render('shellstack', { users, login_Id });

});


// post swipe to db 
app.post("/swipe", async function(req, res) {
    const swiper_Id = req.body.swiper_Id;
    const swiped_Id = req.body.swiped_Id;

    if (!swiper_Id || !swiped_Id) {
        res.status(400).send("Invalid Data");
        return;
    }
    handleSwipe(swiper_Id, swiped_Id);
    // verify it worked 
    res.status(200).send("Swipe recorded");

    const matchSQL = `SELECT * FROM Matches WHERE (swiper_id = ? AND swiped_id = ?) AND EXISTS (SELECT * FROM Matches WHERE swiper_id = ? AND swiped_id = ?)
  `;
    const mutual = await executeSQL(matchSQL, [swiper_Id, swiped_Id, swiped_Id, swiper_Id]);

    if (mutual.length > 0) {
        alert("Congrats you have matched !!!");
    }

});

function getDistance(origins, destinations) {
    return new Promise((resolve, reject) => {
        var result = "";
        distance.matrix(origins, destinations, function(err, distances) {
            if (destinations == "") {
                result += "Zip Null\n";
            }
            if (err) {
                result += err + "\n";
                reject(result);
            }
            if (!distances) {
                result += "no distances\n";
                reject(result);
            }
            if (origins == destinations) {
                result += "Nearby\n";
            }
            if (distances.status == "OK") {
                for (var i = 0; i < origins.length; i++) {
                    for (var j = 0; j < destinations.length; j++) {
                        var origin = distances.origin_addresses[i];
                        var destination = distances.destination_addresses[j];
                        if (distances.rows[0].elements[j].status == "OK") {
                            var distance = distances.rows[i].elements[j].distance.text;
                            result += distance + "\n";
                        } else {
                            result += "Zip N/A\n";
                        }
                    }
                }
            }
            resolve(result);
        });
    });
}

app.get("/user/matches", async function(req, res) {
    const login_Id = req.session.login_Id;
    if (!login_Id) {
        res.redirect('user/login');
        return;
    }


    const sql = "select User.* from User Join Matches On User.login_Id=Matches.swiped_id WHERE Matches.swiper_id= ?";

    const matches_list = await executeSQL(sql, [login_Id]);

    //zip for person logged in
    const zipsql = "select * from User where login_Id = ?";
    const zipusers = await executeSQL(zipsql, [login_Id]);

    const loggedInZip = zipusers[0].zip;



    //console.log(loggedInZip);
    const matchDistances = [];
    for (const match of matches_list) {
        let distance = await getDistance([loggedInZip], [match.zip]);
        matchDistances.push(distance);
        console.log(distance);
    }


    res.render('matches', { matches_list, login_Id, matchDistances });

});
// chat receive messages 
app.get("/messages/:match_id", async function(req, res) {
    const login_Id = req.session.login_Id;
    const match_id = req.params.match_id;

    if (!login_Id) {
        res.redirect("user/login");
        return;
    }
    const sql = "Select * from User where login_Id=?";
    const params = [match_id];

    const match = await executeSQL(sql, params);
    const info = match[0];

    const sqlMessages = "SELECT * FROM messages WHERE (sender_id=? AND receiver_id=?) OR (sender_id=? AND receiver_id=?) ORDER BY timestamp";
    const paramsMessages = [login_Id, match_id, match_id, login_Id];
    const messages = await executeSQL(sqlMessages, paramsMessages);

    res.render("messages", { login_Id, info, messages });
});
// chat send messages
app.post("/messages/:match_id", async function(req, res) {
    const login_Id = req.session.login_Id;
    const match_id = req.params.match_id;
    const content = req.body.content;
    console.log("MESSAGE: " + content);
    const timestamp = new Date();

    if (!login_Id) {
        res.redirect("user/login");
        return;
    }

    const sql = "INSERT INTO messages (sender_id, receiver_id, content, timestamp) VALUES (?, ?, ?, ?)";
    const params = [login_Id, match_id, content, timestamp];
    await executeSQL(sql, params);

});


// delete profile
app.delete("/deleteUser/:login_Id", async function(req, res) {
    const login_Id = req.session.login_Id;
    const param_login = req.params.login_Id;

    if (!login_Id) {
        res.redirect("user/login");
        return;
    }else{
        // im forking and ill try on mine so i dont mess with ur stuff
      const sql=" DELETE from User where login_Id= ? ";
      const params=[param_login];
      await executeSQL(sql,params);

      const sql2=" DELETE from Login_info where login_Id= ? ";
      const params2=[param_login];
      await executeSQL(sql2,params2);

      
      // Destroy the user's session to log them out
        req.session.destroy(function(err) {
            if (err) {
                console.error("Error destroying session: ", err);
            }
            console.log("DELETED");
          
            // needed 
            res.render(__dirname+"/views/login");
            return;
        });
      
    }

});



app.get("/dbTest", async function(req, res) {
    let sql = "SELECT CURDATE()";
    let rows = await executeSQL(sql);
    res.send(rows);
});//dbTest

//functions
async function executeSQL(sql, params) {
    return new Promise(function(resolve, reject) {
        pool.query(sql, params, function(err, rows, fields) {
            if (err) throw err;
            resolve(rows);
        });
    });
}//executeSQL

//values in red must be updated
function dbConnection() {

    const pool = mysql.createPool({

        connectionLimit: 10,
        // change to your db 
        host: "hwr4wkxs079mtb19.cbetxkdyhwsb.us-east-1.rds.amazonaws.com",
        user: "fce800uq6gnsih52",
        password: "vs16vdcxs8zo5d3c",
        database: "nvm16v4ncac04mdt"

    });

    return pool;

} //dbConnection

//start server
app.listen(3000, () => {
    console.log("Expresss server running...")
})


// Configuration 
cloudinary.config({
    cloud_name: "dc71qe7v1",
    api_key: "252228595936919",
    api_secret: "wEwwvClWNr9ouiGZCppr4FdCFDc"
});



