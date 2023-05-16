
# simple Login & Signup Api with Node.js, jsonwebtoken, joi, express-session, ejs, connect-flash and mysql database. 


This Login & Signup API is built using Node.js, jsonwebtoken, joi, express-session, ejs, connect-flash, and MySQL database. Users can sign up and log in using their email and password, and their credentials are securely stored in the database. Upon successful authentication, the user is granted access to protected routes. The API uses jsonwebtoken for secure token-based authentication, joi for validating user input, and connect-flash for displaying error messages. Express-session is used to manage user sessions, and EJS is used as a template engine for rendering views. The MySQL database is used to store user information and credentials securely.


## Database Setup
Setp 1 : For Installing Xaamp sever click on the link below 👇

https://www.ionos.com/digitalguide/server/tools/xampp-tutorial-create-your-own-local-test-server/

Setp 2 : Create Database -- For Creating database on phpmyadmin click on link below 👇

https://www.cs.virginia.edu/~up3f/cs4640/supplement/DB-setup-xampp.html

Setp 3 : Creating Tables on Database -- 

''CREATE TABLE users ( id INT NOT NULL AUTO_INCREMENT, first_name VARCHAR(255) NOT NULL, last_name VARCHAR(255) NOT NULL, dob varchar(50) NOT NULL, email_id VARCHAR(255) NOT NULL, password VARCHAR(255) NOT NULL, created_at datetime NOT NULL DEFAULT CURRENT_TIMESTAMP, updated_at datetime null); ''

Copy this line of code on SQL section in phpmyadmin Database.



## How to setup 

step 1 : create a new Folder where you can stored your nodejs projects files.
 - 

![App Screenshot](https://via.placeholder.com/468x300?text=App+Screenshot+Here)

step 2 :  Create a server.js file on this folder.
 -

![App Screenshot](https://via.placeholder.com/468x300?text=App+Screenshot+Here)

step 3 : Open the folder in VS code
 -

![App Screenshot](https://via.placeholder.com/468x300?text=App+Screenshot+Here)

- VS Code Download link 👉https://code.visualstudio.com/download

step 4 : Open Turminal on VS code 
 -

![App Screenshot](https://via.placeholder.com/468x300?text=App+Screenshot+Here)

- For Terminal you can also use "Hyper Terminal"👉 https://hyper.is/

![App Screenshot](https://via.placeholder.com/468x300?text=App+Screenshot+Here)

- Learn some Terminal commands every user should know👉 https://www.techrepublic.com/article/16-terminal-commands-every-user-should-know/

step 5 : Install dependencies from 👉 https://www.npmjs.com/
 -
- express,
- mysql,
- path, 
- jsonwebtoken, 
- joi, 
- express-session, 
- ejs, 
- dotenv, 
- cookie-parser, 
- connect-flash, 
- body-parser, 
- bcrypt

For example 👉
 -

```javascript
npm i express;
```

That will Create a ```package.json ``` file automatically.

step 6 : Download Nodemon, for automate your server.
 - 

![App Screenshot](https://repository-images.githubusercontent.com/958314/195c4a80-7da7-11e9-9a33-54d9fffac84f)

- You can visit 👉 https://www.npmjs.com/package/nodemon

- Or, you can also install globally run ```npm install -g nodemon ``` in the terminal.

- ⚠ Note 👉 after installing nodemon create a scripts tag in ``` package.json ``` file , and write ```"start": "nodemon server.js"``` below the 'test' scripts.

step 7 : Recommended folder structure 👉
 -

![App Screenshot](https://via.placeholder.com/468x300?text=App+Screenshot+Here)

If everythings all set, now you can start the server.

step 8 : Run the Server 👉
 -


``` npm start ``` run this command on terminal.
## 🔗 You can find me on

[![linkedin](https://img.shields.io/badge/linkedin-0A66C2?style=for-the-badge&logo=linkedin&logoColor=white)](https://www.linkedin.com/in/debayan-bain-19288b217/)
[![twitter](https://img.shields.io/badge/Instagram-E4405F?style=for-the-badge&logo=instagram&logoColor=white)](https://www.instagram.com/maharaja_bain/)

