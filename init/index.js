module.exports = async function (context, req) {
    context.res = {
        status: 200,
        body: JSON.stringify({
            user: {
                role: 1
            },
            roles: [
                { id: 0, name: "guest", rights: ["r"] },
                { id: 1, name: "admin", rights: ["c", "r", "u", "d"] }
            ],
            api: {
                getEntries: "/entries",
                getEntriesByTag: "/tags/{tag}",
                getTags: "/tags"
            }
        })
    };
};