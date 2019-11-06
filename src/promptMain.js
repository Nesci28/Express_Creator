const inquirer = require('inquirer');
inquirer.registerPrompt('directory', require('inquirer-select-directory'));

const helpers = require('./helpers');

module.exports = async function() {
  const answers = await inquirer.prompt([
    {
      type: 'confirm',
      name: 'yarn',
      message: 'Do you want to use Yarn instead of NPM ? 🧠 ',
      default: true,
      when: testForApp('Yarn'),
    },
    {
      type: 'text',
      name: 'name',
      message:
        'Project Name ? 🤔 ' + ' (non alpha characters will be stripped out)\n',
      filter: t => {
        return t.replace(/[^a-zA-Z-]/g, '');
      },
      validate: name => {
        return !name ? 'Pleaser enter a value' : true;
      },
    },
    {
      type: 'text',
      name: 'description',
      message: 'Project Description ? 💌 \n',
      validate: name => {
        return !name ? 'Pleaser enter a value' : true;
      },
    },
    {
      type: 'directory',
      name: 'path',
      message:
        'Select the folder in which you want to create the project ? 📁\n',
      basePath: `${__dirname}`,
    },
    {
      type: 'text',
      name: 'port',
      message: 'Port number to run locally ? 🚪 ' + ' (maximum 65535) ',
      default: 3000,
      filter: t => {
        t = t.replace(/\D+/g, '');
        return +t > 65535 ? 65535 : +t;
      },
    },
    {
      type: 'confirm',
      name: 'cors',
      message: 'Do you want to setup custom CORS domain ? 🛡️ ',
    },
    {
      type: 'text',
      name: 'corsDomains',
      message:
        'Specify each domain separated with ";" 📝 ' +
        ' (http://localhost:3000)',
      when: answers => {
        return answers.cors;
      },
    },
    {
      type: 'checkbox',
      name: 'middlewareList',
      message: 'Which is these middleware do you want to add ? ⚙️ ',
      choices: [
        'Helmet (Help secure Express/Connect apps with various HTTP headers)',
        'Morgan (HTTP request logger middleware for node.js)',
      ],
      filter: t => {
        const choices = [];
        for (const each of t) {
          choices.push(each.split(' ')[0].toLowerCase());
        }
        return choices;
      },
    },
    {
      type: 'list',
      name: 'morganType',
      message: 'Which pre-defined log format do you want ? 💎 ',
      choices: [
        'Combined (Standard Apache combined log output)',
        'Common (Standard Apache common log output)',
        'Dev (Concise output colored by response status for development use)',
        'Short (Shorter than default, also including response time)',
        'Tiny (The minimal output)',
      ],
      default: 'tiny',
      when: answers => {
        return answers.middlewareList.includes('morgan');
      },
      filter: t => {
        return t.split(' ')[0].toLowerCase();
      },
    },
    {
      type: 'confirm',
      name: 'database',
      message: 'Do you want to configure a MongoDB? 💾 ',
      default: true,
    },
    {
      type: 'text',
      name: 'dbUsername',
      message: 'Whats your DB Username ? 👮 ',
      validate: value => {
        return !value ? 'Please enter a value' : true;
      },
      when: answers => {
        return answers.database;
      },
    },
    {
      type: 'password',
      name: 'dbPassword',
      message: 'Whats your DB Password ? 👮 ',
      validate: value => {
        return !value ? 'Please enter a value' : true;
      },
      when: answers => {
        return answers.database;
      },
    },
    {
      type: 'text',
      name: 'dbUrl',
      message: 'Whats your DB Url ? 👮 ' + ' (complete URL with "@")',
      validate: value => {
        return !value ? 'Please enter a value' : true;
      },
      when: answers => {
        return answers.database;
      },
    },
    {
      type: 'text',
      name: 'dbCollection',
      message: 'Whats your DB Collection ? 👮 ',
      validate: value => {
        return !value ? 'Please enter a value' : true;
      },
      when: answers => {
        return answers.database;
      },
    },
    {
      type: 'checkbox',
      name: 'routes',
      message: 'Do you want basic Routes already setup ? 🚧 ',
      choices: ['Hello World', 'Find All', 'Find One by ID', 'Delete by ID'],
    },
  ]);
  return answers;
};

function testForApp(app) {
  helpers.testForApp(app);
}
