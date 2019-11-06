const cp = require('child_process');
const fs = require('fs');
const path = require('path');

const mainPrompt = require('./promptMain');
const helpers = require('./helpers');

(async () => {
  const answers = await mainPrompt();
  console.log(answers);

  // Creating the App Folder
  process.chdir(answers.path);
  fs.mkdirSync(answers.name);
  process.chdir(path.join(answers.path, answers.name));

  // Generating package.json
  helpers.printMsg('Initializing the App...');
  cp.execSync(`npm init -y`);
  let packageJson = fs.readFileSync('package.json');
  packageJson = JSON.parse(packageJson);
  packageJson.name = answers.name;
  packageJson.description = answers.description;
  packageJson.scripts = {
    start: 'node app.js',
    'start:dev': 'nodemon app.js',
  };
  fs.writeFileSync('package.json', JSON.stringify(packageJson, null, 2));
  helpers.printDone('Initializing the App...');

  const packageManager = answers.yarn === true ? 'yarn add' : 'npm install';

  // Installing the dependancies
  helpers.printMsg('Installing the dependancies...');
  cp.execSync(`${packageManager} -D nodemon`);
  cp.execSync(
    `${packageManager} express cors dotenv ${answers.middlewareList.join(' ')}`,
  );
  if (answers.database) {
    cp.execSync(`${packageManager} monk`);
  }
  helpers.printDone('Installing the dependancies...');

  helpers.printMsg('Generating the Express App...');
  let data = '';

  // Require
  data += `const express = require('express');\n`;
  data += `const cors = require('cors');\n`;
  answers.middlewareList.forEach(middleware => {
    data += `const ${middleware} = require('${middleware}')\n`;
  });

  // Database
  if (answers.database) {
    data += `const db = require('monk')(mongodb://${answers.dbUsername}:${
      answers.dbPassword
    }@${answers.dbUrl.split('@')[1]})\n`;
    data += `${answers.dbCollection}DB = db.get('${answers.dbCollection}')\n\n`;
  }

  // Middlewares
  data += `const app = express();\n`;
  data += `app.use(express.json());\n`;
  data += `app.use(express.urlencoded({ extended: false }));\n`;
  answers.middlewareList.forEach(middleware => {
    if (middleware === 'morgan') {
      data += `app.use(morgan('${answers.morganType}'));\n`;
    } else {
      data += `app.use(${middleware}())`;
    }
  });

  // CORS
  const cors = answers.corsDomains.split(';');
  data += `app.use(cors(${
    cors.length === 0 ? '' : '{origin: ' + cors + '}'
  }))\n`;

  // Starting the App
  data += `const PORT = process.env.PORT || ${answers.port};\n`;
  data += `app.listen(PORT, () => { console.log(\`Listening on port: \$\{PORT\}\`) })`;
  fs.writeFileSync('app.js', data);
  helpers.printDone('Generating the Express App...');
})();
