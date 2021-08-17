import { Message, MessageEmbed } from "discord.js";
import { Command } from "../../interfaces";
import { trim, urlToColours } from "../../utils";

export const command: Command = {
    name: "say",
    aliases: [],
    category: "moderation",
    description:
      "Bento repeats your message. If embed is added as an argument, Bento shows the message as en embed",
    usage: "say [embed] <input>",
    website: 'https://www.bentobot.xyz/commands#say',
    run: async (client, message, args): Promise<Message> => {
        await message.delete();

        if (!message.member.hasPermission("MANAGE_MESSAGES"))
          return message.channel.send("You do not have permission to use this command.").then((m) => m.delete({ timeout: 5000 }));

        if (args.length < 1) return message.channel.send("You must specify something for me to repeat!").then((m) => m.delete({ timeout: 5000 }));

        if (args[0].toLowerCase() === "embed") {
          const embed = new MessageEmbed()
            .setColor(`${await urlToColours(client.user.avatarURL({ format: "png" }))}`)
            .setDescription(trim(args.slice(1).join(" "), 4096));

          await message.channel.send(embed);
        } else {
          message.channel.send(args.join(" "));
        }
    },
};
