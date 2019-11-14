#! /usr/bin/env node

const cp = require('child_process');
const fs = require('fs');
const path = require('path');

const mainPrompt = require('./promptMain');
const helpers = require('./helpers');

async function main() {
  const toNull = process.platform === 'win32' ? 'nul 2>&1' : '/dev/null 2>&1';

  const answers = await mainPrompt();

  // Creating the App Folder
  process.chdir(answers.path);
  fs.mkdirSync(answers.name);
  process.chdir(path.join(answers.path, answers.name));

  // Generating package.json
  helpers.printMsg('Initializing the App...');
  cp.execSync(`npm init -y > ${toNull}`);
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
  cp.execSync(`${packageManager} -D nodemon > ${toNull}`);
  cp.execSync(
    `${packageManager} express cors dotenv ${answers.middlewareList.join(
      ' ',
    )} > ${toNull}`,
  );
  if (answers.database) {
    cp.execSync(`${packageManager} monk > ${toNull}`);
  }
  helpers.printDone('Installing the dependancies...');

  helpers.printMsg('Generating the Express App...');
  fs.mkdirSync('routes');

  let data = '';

  // Requirements
  data += `const express = require('express');\n`;
  data += `const cors = require('cors');\n`;
  answers.middlewareList.forEach(middleware => {
    data += `const ${middleware} = require('${middleware}');\n`;
  });

  // Database
  if (answers.database) {
    data += `\n// Database\n`;
    data += `const db = require('monk')('mongodb:\/\/${answers.dbUsername}:${
      answers.dbPassword
    }@${answers.dbUrl.split('@')[1]}');\n`;
    data += `${answers.dbCollection}DB = db.get('${answers.dbCollection}');\n\n`;
  }

  // Middlewares
  data += `// Middlewares\n`;
  data += `const app = express();\n`;
  data += `app.use(express.json());\n`;
  data += `app.use(express.urlencoded({ extended: false }));\n`;
  answers.middlewareList.forEach(middleware => {
    if (middleware === 'morgan') {
      data += `app.use(morgan('${answers.morganType}'));\n`;
    } else {
      data += `app.use(${middleware}());\n`;
    }
  });

  // CORS
  data += `\n// CORS\n`;
  answers.corsDomains += `;`;
  const cors = answers.corsDomains
    .split(';')
    .filter(cor => cor !== '' && cor !== 'undefined');
  data += `app.use(cors(${
    cors.length === 0 ? '' : '{origin: ' + cors + '}'
  }))\n\n`;

  data += `// Routes\n`;
  data += `app.use("/api/db", require("./routes/db.js"));\n\n`;

  // Starting the App
  data += `// Starting the App\n`;
  data += `const PORT = process.env.PORT || ${answers.port};\n`;
  data += `app.listen(PORT, () => { console.log(\`Listening on port: \$\{PORT\}\`) })`;
  fs.writeFileSync('app.js', data);
  helpers.printDone('Generating the Express App...');

  helpers.printMsg('Generating the Routes...');
  data = '';

  if (answers.routes.includes('Find All')) {
    data += `app.get('/', async (_, res) => {
        let data = await ${answers.dbCollection}DB.find({});
        db.close();
        res.send(data);
      });\n\n`;
  }

  if (answers.routes.includes('Find One by ID')) {
    data += `app.get('/:id', async (req, res) => {
      const id = req.params.id;
      let data = await ${answers.dbCollection}DB.find({
        id
      });
      db.close();
      res.json({
        data
      });
    });\n\n`;
  }

  if (answers.routes.includes('Delete by ID')) {
    data += `app.delete('/:id', async (req, res) => {
      const id = req.params.id;
      let data = await ${answers.dbCollection}DB.findOneAndDelete({
        id
      });
      db.close();
      res.json({
        data
      });
    });\n\n`;
  }
  fs.writeFileSync('routes/db.js', data);
  helpers.printDone('Generating the Routes...');
}

main();
