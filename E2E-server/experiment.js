const bcrypt = require('bcrypt');
const saltRounds = 10; // You can adjust this value as needed

const plainPassword = 'user_password';
console.log("🚀 ~ plainPassword:", plainPassword)

bcrypt.genSalt(saltRounds, function(err, salt) {
    bcrypt.hash(plainPassword, salt, function(err, hash) {
        if (err) throw err;
        // Store the 'hash' in your database
    });
});