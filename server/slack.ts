import { slack, supabase } from "./services"

slack.message(
  /(?:good){0,1} {0,1}(?:boy|girl|dog|pup|puppers{0,1}|puppy|laf{1,2}ie|laf{1,2}y|lafayette|fluffybutt|doggy|doggie|fluffael)/i,
  async ({ message, say }) => {
    const { channel_type } = message
    console.log("msg:", message)
    if (channel_type !== "im") return
    say("Woof! Woof! :poodle:")
  }
)

slack.event("app_home_opened", async ({ event, client, logger }) => {
  try {
    const { user } = event
    const info = await client.users.info({ user })
    const name = info.user?.profile?.real_name || "there"
    const isActive = await supabase.from("slack_user").select("active").eq("id", user).single()
    const result = await client.views.publish({
      user_id: user,
      view: {
        type: "home",
        blocks: [
          {
            type: "image",
            image_url: "https://i.imgur.com/60YsZdC.png",
            alt_text: "Lafayette",
          },
          {
            type: "header",
            text: {
              type: "plain_text",
              text: `:poodle: Hi ${name}! :wave:`,
              emoji: true,
            },
          },
          {
            type: "section",
            text: {
              type: "mrkdwn",
              text: "My dog training is going well! I can sit, stay, and roll over... But _most_ importantly, I can *fetch*!",
            },
          },
          {
            type: "divider",
          },
          {
            type: "section",
            text: {
              type: "mrkdwn",
              text: "*Want me to _fetch_ your shortcut mentions?* :bone:",
            },
          },
          {
            type: "context",
            elements: [
              {
                type: "mrkdwn",
                text: `:thought_balloon: The button below will take you to a page where you can authorize me to access your Shortcut mentions across all of your shortcut workspaces.`,
              },
            ],
          },
          {
            type: "context",
            elements: [
              {
                type: "mrkdwn",
                text: `After you've authorized me, I'll DM you with the message whenever you're mentioned in a Shortcut comment!`,
              },
            ],
          },
          {
            type: "actions",
            elements: [
              {
                type: "button",
                text: {
                  type: "plain_text",
                  text: isActive ? "Disable Shortcut Sync" : "Sync Shortcut Mentions :dog::right_anger_bubble:",
                  emoji: true,
                },
                value: "sync_shortcut_mentions",
                action_id: "sync_shortcut_mentions",
                style: isActive ? "danger" : "primary",
                url: process.env.APP_URL + (isActive ? "/" : "/login"),
              },
            ],
          },

          {
            type: "divider",
          },
          {
            type: "context",
            elements: [
              {
                type: "mrkdwn",
                text: "If you have any issues, please reach out to <@U025C85LM6U>.",
              },
            ],
          },
        ],
      },
    })
    logger.info("Published home tab for user: ", user)
  } catch (error) {
    logger.error(error)
  }
})
