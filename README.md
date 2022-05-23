# blog-server

Backend function app for my blog

# Conventions

All top level responses should be objects so as to leave the possibility of including links or other meta information. Even though endpoints such as "entries" and "tags" may only contain an array of entities which contain their own links, a consistent approach should be enforced so that the consuming client application has an expectation. For that reason, even if top level links or other meta data are not needed, the response should still contain an object with a property such as "entries", which contains the expected array.

The ID directly following an endpoing entity name should always refer to the ID of the entity name proceeding it. In other words:

/comment/16

...refers to a comment with ID 16

/entry/something-amazing-happened

...refers to an entry with ID "something-amazing-happened"

For the time being, in order to keep with the most consistent semantics possible, it appears best to require multiple requests to perform bulk actions. In other words, the approach of having a "publishComment" endpoint should be deprecated in favor of multiple calls to comment/[id] so less business logic needs to be incorporated to determine different scenarios.
