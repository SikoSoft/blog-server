# blog-server

Backend function app for my blog

# Conventions

All top level responses should be objects so as to leave the possibility of including links or other meta information. Even though endpoints such as "entries" and "tags" may only contain an array of entities which contain their own links, a consistent approach should be enforced so that the consuming client application has an expectation. For that reason, even if top level links or other meta data are not needed, the response should still contain an object with a property such as "entries", which contains the expected array.
