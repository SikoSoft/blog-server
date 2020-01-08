const URL = require("url").URL;

function pad(x, padding = 2) {
  return x.toString().padStart(padding, "0");
}

function shortDate(time) {
  const date = new Date(time);
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(
    date.getDate()
  )}`;
}

module.exports = {
  baseUrl: urlString => {
    const url = new URL(urlString);
    const pathDirs = url.pathname.split("/");
    return `${url.origin}${pathDirs.slice(0, pathDirs.length - 1).join("/")}`;
  },

  mockEntries: () => {
    return [
      {
        created: 1564948499,
        title: "testing 123",
        body: [
          { insert: "Fuck off" },
          { attributes: { header: 1 }, insert: "\n" },
          { insert: "\n" },
          { attributes: { italic: true }, insert: "pretentious" },
          { insert: "\n\n" },
          { attributes: { underline: true }, insert: "blah" },
          { insert: "\n" }
        ],
        tags: ["testing", "blog", "poop"]
      },
      {
        created: 1567880688,
        title: "Where have all the free thinkers gone?",
        body: [
          {
            attributes: { italic: true },
            insert:
              "The web development industry is full of pretentious nitwits who have never had a single original thought in their entire lives."
          },
          { insert: "\n\n" },
          { attributes: { bold: true }, insert: "It needs to be said." },
          { insert: "\n" }
        ],
        tags: ["webdev", "fuck"]
      }
    ].map(entry => {
      return {
        ...entry,
        id: `${shortDate(entry.created * 1000)}/${entry.title
          .toLowerCase()
          .replace(/ /g, "-")
          .replace(/[^a-z0-9-]/, "")}`
      };
    });
  }
};
