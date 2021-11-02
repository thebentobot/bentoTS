create sequence "guildMember_guildMemberID_seq"
    as integer;

create sequence "tag_tagID_seq"
    as integer;

create sequence "mute_muteCase_seq"
    as integer;

create sequence "ban_banCase_seq"
    as integer;

create sequence "warning_warningCase_seq"
    as integer;

create sequence "kick_kickCase_seq"
    as integer;

create sequence "bento_bentoDate_seq";

create type horos as enum ('Aries', 'Taurus', 'Gemini', 'Cancer', 'Leo', 'Virgo', 'Libra', 'Scorpio', 'Sagittarius', 'Capricorn', 'Aquarius', 'Pisces');

create type roletypes as enum ('main', 'sub', 'other');

create table if not exists guild
(
    "guildID"     bigint       not null
        constraint guild_pk
            primary key,
    "guildName"   varchar(255) not null,
    prefix        varchar(16)  not null,
    tiktok        boolean      not null,
    leaderboard   boolean      not null,
    media         boolean      not null,
    icon          varchar,
    "memberCount" integer
);

create unique index if not exists guild_guildid_uindex
    on guild ("guildID");

create table if not exists "user"
(
    "userID"      bigint  not null
        constraint user_pk
            primary key,
    discriminator varchar not null,
    xp            integer not null,
    level         integer not null,
    username      varchar,
    "avatarURL"   varchar
);

create unique index if not exists user_userid_uindex
    on "user" ("userID");

create table if not exists weather
(
    "userID" bigint       not null
        constraint weather_pk
            primary key
        constraint weather_user_userid_fk
            references "user",
    city     varchar(255) not null
);

create unique index if not exists weather_userid_uindex
    on weather ("userID");

create table if not exists bento
(
    "userID"    bigint                                 not null
        constraint bento_pk
            primary key
        constraint bento_user_userid_fk
            references "user",
    bento       integer                                not null,
    "bentoDate" timestamp with time zone default now() not null
);

create unique index if not exists bento_userid_uindex
    on bento ("userID");

create table if not exists horoscope
(
    "userID"  bigint not null
        constraint horoscope_pk
            primary key
        constraint horoscope_user_userid_fk
            references "user",
    horoscope horos  not null
);

create unique index if not exists horoscope_userid_uindex
    on horoscope ("userID");

create table if not exists lastfm
(
    "userID" bigint       not null
        constraint lastfm_pk
            primary key
        constraint lastfm_user_userid_fk
            references "user",
    lastfm   varchar(255) not null
);

create unique index if not exists lastfm_userid_uindex
    on lastfm ("userID");

create table if not exists "guildMember"
(
    "guildMemberID" bigint default nextval('"guildMember_guildMemberID_seq"'::regclass) not null
        constraint guildmember_pk
            primary key,
    "userID"        bigint                                                              not null
        constraint guildmember_user_userid_fk
            references "user",
    "guildID"       bigint                                                              not null
        constraint guildmember_guild_guildid_fk
            references guild,
    xp              integer                                                             not null,
    level           integer                                                             not null,
    "avatarURL"     varchar
);

alter sequence "guildMember_guildMemberID_seq" owned by "guildMember"."guildMemberID";

create unique index if not exists guildmember_guildmemberid_uindex
    on "guildMember" ("guildMemberID");

create table if not exists tag
(
    "tagID"   bigint                   default nextval('"tag_tagID_seq"'::regclass) not null
        constraint tag_pk
            primary key,
    "userID"  bigint                                                                not null
        constraint tag_user_userid_fk
            references "user",
    "guildID" bigint                                                                not null
        constraint tag_guild_guildid_fk
            references guild,
    date      timestamp with time zone default now(),
    command   varchar(255)                                                          not null,
    content   varchar                                                               not null,
    count     integer                                                               not null
);

alter sequence "tag_tagID_seq" owned by tag."tagID";

create unique index if not exists tag_tagid_uindex
    on tag ("tagID");

create table if not exists mute
(
    "muteCase"   bigint                   default nextval('"mute_muteCase_seq"'::regclass) not null
        constraint mute_pk
            primary key,
    "userID"     bigint                                                                    not null,
    "guildID"    bigint                                                                    not null
        constraint mute_guild_guildid_fk
            references guild,
    date         timestamp with time zone default now()                                    not null,
    "muteEnd"    timestamp with time zone,
    note         varchar,
    actor        bigint                                                                    not null,
    reason       varchar,
    "MuteStatus" boolean                                                                   not null
);

alter sequence "mute_muteCase_seq" owned by mute."muteCase";

create unique index if not exists mute_mutecase_uindex
    on mute ("muteCase");

create table if not exists ban
(
    "banCase" bigint                   default nextval('"ban_banCase_seq"'::regclass) not null
        constraint ban_pk
            primary key,
    "userID"  bigint                                                                  not null,
    "guildID" bigint                                                                  not null
        constraint ban_guild_guildid_fk
            references guild,
    date      timestamp with time zone default now()                                  not null,
    note      varchar,
    actor     bigint                                                                  not null,
    reason    varchar
);

alter sequence "ban_banCase_seq" owned by ban."banCase";

create unique index if not exists ban_mutecase_uindex
    on ban ("banCase");

create table if not exists warning
(
    "warningCase" bigint                   default nextval('"warning_warningCase_seq"'::regclass) not null
        constraint warning_pk
            primary key,
    "userID"      bigint                                                                          not null,
    "guildID"     bigint                                                                          not null
        constraint warning_guild_guildid_fk
            references guild,
    date          timestamp with time zone default now()                                          not null,
    note          varchar,
    actor         bigint                                                                          not null,
    reason        varchar
);

alter sequence "warning_warningCase_seq" owned by warning."warningCase";

create unique index if not exists warning_mutecase_uindex
    on warning ("warningCase");

create table if not exists kick
(
    "kickCase" bigint                   default nextval('"kick_kickCase_seq"'::regclass) not null
        constraint kick_pk
            primary key,
    "userID"   bigint                                                                    not null,
    "guildID"  bigint                                                                    not null
        constraint kick_guild_guildid_fk
            references guild,
    date       timestamp with time zone default now()                                    not null,
    note       varchar,
    actor      bigint                                                                    not null,
    reason     varchar
);

alter sequence "kick_kickCase_seq" owned by kick."kickCase";

create unique index if not exists kick_mutecase_uindex
    on kick ("kickCase");

create table if not exists "modLog"
(
    "guildID" bigint not null
        constraint modlog_pk
            primary key
        constraint modlog_guild_guildid_fk
            references guild,
    channel   bigint not null
);

create unique index if not exists modlog_guildid_uindex
    on "modLog" ("guildID");

create table if not exists "messageLog"
(
    "guildID" bigint not null
        constraint messagelog_pk
            primary key
        constraint messagelog_guild_guildid_fk
            references guild,
    channel   bigint not null
);

create unique index if not exists messagelog_guildid_uindex
    on "messageLog" ("guildID");

create table if not exists welcome
(
    "guildID" bigint not null
        constraint welcome_pk
            primary key
        constraint welcome_guild_guildid_fk
            references guild,
    message   varchar,
    channel   bigint
);

create unique index if not exists welcome_guildid_uindex
    on welcome ("guildID");

create table if not exists bye
(
    "guildID" bigint not null
        constraint bye_pk
            primary key
        constraint bye_guild_guildid_fk
            references guild,
    message   varchar,
    channel   bigint
);

create unique index if not exists bye_guildid_uindex
    on bye ("guildID");

create table if not exists "muteRole"
(
    "guildID" bigint not null
        constraint muterole_pk
            primary key
        constraint muterole_guild_guildid_fk
            references guild,
    "roleID"  bigint not null
);

create unique index if not exists muterole_guildid_uindex
    on "muteRole" ("guildID");

create unique index if not exists muterole_role_uindex
    on "muteRole" ("roleID");

create table if not exists "autoRole"
(
    "autoRoleID" bigserial
        constraint autorole_pk
            primary key,
    "guildID"    bigint not null
        constraint autorole_guild_guildid_fk
            references guild,
    "roleID"     bigint not null
);

create unique index if not exists autorole_autoroleid_uindex
    on "autoRole" ("autoRoleID");

create table if not exists reminder
(
    id       serial
        constraint reminder_pk
            primary key,
    "userID" bigint                                 not null
        constraint reminder_user_userid_fk
            references "user",
    date     timestamp with time zone default now() not null,
    reminder varchar                                not null
);

create unique index if not exists reminder_id_uindex
    on reminder (id);

create table if not exists "caseGlobal"
(
    "guildID"    bigint  not null
        constraint caseglobal_pk
            primary key
        constraint caseglobal_guild_guildid_fk
            references guild,
    "serverName" boolean not null,
    reason       boolean not null
);

create unique index if not exists caseglobal_guildid_uindex
    on "caseGlobal" ("guildID");

create table if not exists "notificationMessage"
(
    id        serial
        constraint notificationmessage_pk
            primary key,
    "userID"  bigint  not null
        constraint notificationmessage_user_userid_fk
            references "user",
    "guildID" bigint  not null,
    content   varchar not null,
    global    boolean
);

create unique index if not exists notificationmessage_id_uindex
    on "notificationMessage" (id);

create table if not exists "memberLog"
(
    "guildID" bigint not null
        constraint memberlog_pk
            primary key
        constraint memberlog_guild_guildid_fk
            references guild,
    channel   bigint not null
);

create unique index if not exists memberlog_channel_uindex
    on "memberLog" (channel);

create unique index if not exists memberlog_guildid_uindex
    on "memberLog" ("guildID");

create table if not exists "roleMessages"
(
    "guildID"   bigint not null
        constraint rolemessages_pk
            primary key
        constraint rolemessages_guild_guildid_fk
            references guild,
    "messageID" bigint,
    message     varchar
);

create table if not exists "availableRolesGuild"
(
    role      varchar   not null,
    id        serial
        constraint availablerolesguild_pk
            primary key,
    "guildID" bigint    not null
        constraint availablerolesguild_guild_guildid_fk
            references guild,
    type      roletypes not null
);

create unique index if not exists availablerolesguild_id_uindex
    on "availableRolesGuild" (id);

create table if not exists "roleChannel"
(
    "guildID"   bigint not null
        constraint rolechannel_pk
            primary key
        constraint rolechannel_guild_guildid_fk
            references guild,
    "channelID" bigint not null
);

create unique index if not exists rolechannel_channelid_uindex
    on "roleChannel" ("channelID");

create unique index if not exists rolechannel_guildid_uindex
    on "roleChannel" ("guildID");

create table if not exists role
(
    id            serial
        constraint role_pk
            primary key,
    "roleID"      bigint  not null,
    "roleCommand" varchar not null,
    "roleName"    varchar,
    "guildID"     bigint  not null
        constraint role_guild_guildid_fk
            references guild,
    type          roletypes
);

create unique index if not exists role_id_uindex
    on role (id);

create table if not exists patreon
(
    id           serial
        constraint patreon_pk
            primary key,
    "userID"     bigint  not null
        constraint patreon_user_userid_fk
            references "user",
    name         varchar,
    avatar       varchar,
    supporter    boolean not null,
    follower     boolean not null,
    enthusiast   boolean not null,
    disciple     boolean not null,
    sponsor      boolean not null,
    "emoteSlot1" varchar,
    "emoteSlot2" varchar,
    "emoteSlot3" varchar,
    "emoteSlot4" varchar
);

create unique index if not exists patreon_id_uindex
    on patreon (id);

create unique index if not exists patreon_userid_uindex
    on patreon ("userID");

create table if not exists profile
(
    "userID"                     bigint not null
        constraint profile_pk
            primary key
        constraint profile_user_userid_fk
            references "user",
    "lastfmBoard"                boolean,
    "xpBoard"                    boolean,
    "backgroundUrl"              varchar,
    "BackgroundColourOpacity"    integer,
    "backgroundColour"           varchar,
    "descriptionColourOpacity"   integer,
    "descriptionColour"          varchar,
    "overlayOpacity"             integer,
    "overlayColour"              varchar,
    "usernameColour"             varchar,
    "discriminatorColour"        varchar,
    "sidebarItemServerColour"    varchar,
    "sidebarItemGlobalColour"    varchar,
    "sidebarItemBentoColour"     varchar,
    "sidebarItemTimezoneColour"  varchar,
    "sidebarValueServerColour"   varchar,
    "sidebarValueGlobalColour"   varchar,
    "sidebarValueBentoColour"    varchar,
    "sidebarOpacity"             integer,
    "sidebarColour"              varchar,
    "sidebarBlur"                integer,
    "fmDivBGOpacity"             integer,
    "fmDivBGColour"              varchar,
    "fmSongTextOpacity"          integer,
    "fmSongTextColour"           varchar,
    "fmArtistTextOpacity"        integer,
    "fmArtistTextColour"         varchar,
    "xpDivBGOpacity"             integer,
    "xpDivBGColour"              varchar,
    "xpTextOpacity"              integer,
    "xpTextColour"               varchar,
    "xpText2Opacity"             integer,
    "xpText2Colour"              varchar,
    "xpDoneServerColour1Opacity" integer,
    "xpDoneServerColour1"        varchar,
    "xpDoneServerColour2Opacity" integer,
    "xpDoneServerColour2"        varchar,
    "xpDoneServerColour3Opacity" integer,
    "xpDoneServerColour3"        varchar,
    "xpDoneGlobalColour1Opacity" integer,
    "xpDoneGlobalColour1"        varchar,
    "xpDoneGlobalColour2Opacity" integer,
    "xpDoneGlobalColour2"        varchar,
    "xpDoneGlobalColour3Opacity" integer,
    "xpDoneGlobalColour3"        varchar,
    description                  varchar,
    timezone                     varchar,
    birthday                     varchar,
    "xpBarOpacity"               integer,
    "xpBarColour"                varchar,
    "xpBar2Opacity"              integer,
    "xpBar2Colour"               varchar
);

create unique index if not exists profile_userid_uindex
    on profile ("userID");

create table if not exists "gfycatBlacklist"
(
    id       serial
        constraint gfycatblacklist_pk
            primary key,
    username varchar not null
);

create unique index if not exists gfycatblacklist_id_uindex
    on "gfycatBlacklist" (id);

create unique index if not exists gfycatblacklist_username_uindex
    on "gfycatBlacklist" (username);

create table if not exists "rpsGame"
(
    id               serial
        constraint rpsgame_pk
            primary key,
    "userID"         bigint not null
        constraint rpsgame_user_userid_fk
            references "user",
    "paperWins"      integer,
    "paperLosses"    integer,
    "rockWins"       integer,
    "rockLosses"     integer,
    "scissorWins"    integer,
    "scissorsLosses" integer,
    "paperTies"      integer,
    "rockTies"       integer,
    "scissorsTies"   integer
);

create unique index if not exists rpsgame_id_uindex
    on "rpsGame" (id);

create unique index if not exists rpsgame_userid_uindex
    on "rpsGame" ("userID");


