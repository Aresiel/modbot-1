const util = require('../lib/util.js');

const command = {};

command.description = 'Kick a user';

command.usage = '@user|userId <reason>';

command.names = ['kick'];

command.execute = async (message, args, database, bot) => {
  if(!await util.isMod(message.member) && !message.member.hasPermission('KICK_MEMBERS')) {
    await message.react(util.icons.error);
    return;
  }

  let userId = util.userMentionToId(args.shift());
  if (!userId) {
    await message.react(util.icons.error);
    await message.channel.send("Please provide a user (@Mention or ID)!");
    return;
  }

  let member;
  try {
    member = await message.guild.members.fetch(userId);
  } catch (e) {
    await message.react(util.icons.error);
    await message.channel.send("User not found or not in guild!");
    return;
  }

  if (member.user.bot) {
    await message.react(util.icons.error);
    await message.channel.send("You can't interact with bots!");
    return;
  }


  //highest role check
  if(message.member.roles.highest.comparePositionTo(member.roles.highest) <= 0 || await util.isMod(member)){
    await message.react(util.icons.error);
    await message.channel.send("You don't have the permission to kick that member!");
    return;
  }

  command.kick(message.guild, member, message.author, args.join(' '), message.channel);
};

command.kick = async (guild, member, moderator, reason, channel) => {
  reason = reason || 'No reason provided.';

  let insert = await util.moderationDBAdd(guild.id, member.id, "kick", reason, null, moderator.id);

  try {
    await member.send(`You were kicked from \`${guild.name}\` | ${reason}`);
  } catch (e) {}
  await member.kick(`${moderator.username}#${moderator.discriminator} | `+reason);

  if (channel) {
    await util.chatSuccess(channel, member.user, reason, "kicked");
  }
  await util.logMessageModeration(guild.id, moderator, member.user, reason, insert, "Kick");
};

module.exports = command;
