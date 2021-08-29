require('dotenv').config();

const fs = require('fs');
const { Sequelize, DataTypes, where } = require('sequelize');
const { Client, Intents, MessageEmbed, Message, Collection } = require('discord.js');
const { REST } = require('@discordjs/rest');
const { Routes } = require('discord-api-types/v9');
const { token } = require('../config.json')

const submission = require('./models/submission');

const client = new Client({ intents: [Intents.FLAGS.GUILDS, Intents.FLAGS.GUILD_MESSAGES] });
client.commands = new Collection()

const commands = [];
const commandFiles = fs.readdirSync('./src/commands').filter(file => file.endsWith('.js'));

const clientId = '867194855717732382';
const guildId = '853453367938252800';

for (const file of commandFiles) {
	const command = require(`./commands/${file}`);
	// set a new item in the Collection
	// with the key as the command name and the value as the exported module
	client.commands.set(command.data.name, command);
	console.info(`Created: ${command.data.name}`)
	commands.push(command.data.toJSON());
}

const rest = new REST({ version: '9' }).setToken(token);

(async () => {
	try {
		console.log('Started refreshing application (/) commands.');

		await rest.put(
			Routes.applicationGuildCommands(clientId, guildId),
			{ body: commands },
		);

		console.log('Successfully reloaded application (/) commands.');
	} catch (error) {
		console.error(error);
	}
})();

const sequelize = new Sequelize('database', 'username', 'password', {
	host: 'localhost',
	dialect: 'sqlite',
	logging: false,
	// SQLite only
	storage: 'database.sqlite',
});

const Submissions = sequelize.define('submissions', {
	id: {
		type: DataTypes.UUIDV4,
		primaryKey: true,
	},
	user_id: {
		type: DataTypes.STRING,
		allowNull: false,
	},
	guild_id: {
		type: DataTypes.STRING,
		allowNull: false,
	},
	char_name: {
		type: DataTypes.STRING,
		allowNull: false,
	},
	char_link: {
		type: DataTypes.STRING,
		allowNull: false,
	},
	approved: {
		type: DataTypes.BOOLEAN,
		defaultValue: false,
		allowNull: false,
	},
	approved_by: {
		type: DataTypes.STRING,
		defaultValue: null,
	},
}, {
	timestamps: true,
});

client.once('ready', () => {

	Submissions.sync();
});

client.on('interactionCreate', async interaction => {
	if (!interaction.isCommand()) return;

	const { commandName } = interaction;

	
	if (!client.commands.has(commandName)) return;

	try {
		await client.commands.get(commandName).execute(interaction);
	} catch (error) {
		
		await interaction.reply({ content: 'There was an error while executing this command!', ephemeral: true });
	}

	// else if (command === 'approve') {
	// 	const sub_id = interaction.options.getString('id');

	// 	// equivalent to: SELECT * FROM Submissions WHERE name = 'tagName' LIMIT 1;
	// 	const sub = await Submissions.findOne({ where: { id: sub_id }});
	// 	if (sub) {
	// 		// equivalent to: UPDATE Submissions SET usage_count = usage_count + 1 WHERE name = 'tagName';
	// 		await Submissions.update({ approved: true, approved_by: interaction.member.user.tag }, { where: { id: sub_id } });

	// 		return interaction.reply(tag.get('description'));
	// 	}
	// 	return interaction.reply(`Could not find tag: ${sub_id}`);
	// }
	// else if (command === 'get') {
	// 	const sub_id = interaction.options.getString('sub_id');

	// 	// equivalent to: SELECT * FROM Submissions WHERE name = 'tagName' LIMIT 1;
	// 	const sub = await Submissions.findOne({ where: { id: sub_id }});
	// 	if (sub) {
	// 		return interaction.reply(`${sub.id} was created by ${sub.user_id} at ${sub.createdAt} and ${sub.approved ? `was approved by ${sub.approved_by}.`: 'is pending approval' }`);
	// 	}
	// 	return interaction.reply(`Could not find tag: ${sub_id}`);
	// }
	// else if (command === 'list') {
	// 	const subList = await Submissions.findAll({ where: { user_id: interaction.user.id }});
	// 	const Submissionstring = subList.map(s => `Submission id: ${s.id} - Character: ${s.char_name}`).join(', ') || 'No Submissions set.';
	// 	return interaction.reply(`List of Submissions: ${Submissionstring}`);
	// }
});

client.login(token);