const bcrypt = require('bcryptjs');

const generateHash = async () => {
    const salt = await bcrypt.genSalt(10);
    const hash = await bcrypt.hash("admin123", salt); //  naya password hai
    console.log("Naya Hash ye hai:", hash);
};

generateHash();