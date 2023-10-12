# Otter Fodder

Otter Fodder is a student group projectgit, a dating app designed for students at CSU Monterey Bay. It is built using Node.js, HTML, and CSS.

## Features

- **User Registration:** Users can create a new account with their email, phone number, and password. Passwords are securely hashed using bcrypt to protect user data.

- **User Login:** Registered users can log in to their accounts.

- **User Profiles:** Users can create and update their profiles, including information such as their name, bio, location, and images. They can also upload profile pictures.

- **Matching:** The app allows users to swipe right or left on potential matches. When two users both swipe right, it's considered a match.

- **Messaging:** Matched users can send messages to each other through the app.

- **Location-Based Matching:** The app uses the Google Distance Matrix API to help users find matches based on location.

## Installation

To run this project locally, follow these steps:

1. Clone the repository:  
   git clone https://github.com/BVonan/OtterFodder.git
   cd otter-fodder

2. Install dependencies:
   npm install

3. Configure your database settings by editing the `dbConnection` function in your code to match your database credentials.

4. Start the server:
   node app.js

5. Open your web browser and visit [http://localhost:3000](http://localhost:3000) to access the app.

## Usage

- Register a new account by providing your email, phone number, and password.

- Log in with your registered credentials.

- Create and update your user profile with your personal information and images.

- Browse and match with other users.

- Send and receive messages from your matches.

## Acknowledgments

- The project uses [Cloudinary](https://cloudinary.com/) for image hosting.
- Google Maps Distance Matrix API is used for location-based matching.
# OtterFodder
