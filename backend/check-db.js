const mongoose = require('mongoose');
const User = require('./src/models/User');
const dotenv = require('dotenv');
const path = require('path');
dotenv.config({ path: path.join(__dirname, '.env') });

mongoose.connect(process.env.MONGO_URI)
  .then(async () => {
    const providers = await User.find({ role: 'Provider', providerType: 'Cab' });
    console.log(`Found ${providers.length} cab providers:`);
    for (let p of providers) {
      console.log(`${p._id} - ${p.email} - ${p.name}`);
    }
    process.exit(0);
  });
