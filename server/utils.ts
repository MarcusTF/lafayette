import axios from "axios"

const quips = [
  "Treat Please! 🦴",
  "I think it's time for belly rubs, you're not busy, right? 🐾",
  "I can confirm there is no squeaky inside of this one.",
  "Okay, now you throw it, and I'll go get it again! 🎾",
  "*_chases tail_*",
  "You're welcome! Now if you'll excuse me, I think I saw a cat on the way over here, and I need to go investigate. 🔎",
  "These are not nearly as crinkly as I was hoping.",
  "Why do you even want me to bring you these, they don't even squeak or anything. 🙄",
  "I'm not leaving until I get some pets, so...",
]

export function getQuip() {
  return quips[Math.floor(Math.random() * quips.length)]
}

class Members {
  private members = [] as { [k: string]: any }[]
  get() {
    return this.members
  }
  set(members: { [k: string]: any }[]) {
    this.members = members
  }
}

export const members = new Members()

export const fetchMembers = async () => {
  try {
    members.set(
      (
        await axios.get("https://api.app.shortcut.com/api/v3/members", {
          headers: {
            "Content-Type": "application/json",
            "Shortcut-Token": process.env.SHORTCUT_TOKEN,
          },
        })
      )?.data
    )
    console.log("Fetched Shortcut members")
  } catch (error) {
    console.error(error)
  }
}
