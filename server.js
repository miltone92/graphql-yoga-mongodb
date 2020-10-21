const { GraphQLServer } = require('graphql-yoga');
const mongodb = require('mongodb');

const users = [];

//  Connect to collection
let loadMongoCollection = async (collection) => {
  const client = await mongodb.MongoClient.connect(
    'mongodb+srv://milton:milton@bbgcluster-m9enp.mongodb.net/test?retryWrites=true&w=majority',
    { useNewUrlParser: true }
  );

  return client.db('BbgCluster').collection(`${collection}`);
};

const typeDefs = `
    type User {
        _id: String
        email: String!
        name: String!
        username: String!
        password: String!
    }

    type Query{
        users: [User!]
        user(_id: ID!): User 
    }

    type Mutation {
        addUser( email: String!, name: String!, username: String!, password: String):ID!
        deleteUser( _id: ID! ):ID!
        updateUser( _id: ID! , name: String, username: String, password: String):ID!
    }
`;

const resolvers = {
  Query: {
    users: async () => {
      let users = await loadMongoCollection('Users');
      users = await users.find({}).toArray();
      return users;
    },
    user: async (parent, { _id }) => {
      const users = await loadMongoCollection('Users');
      const foundUser = await users.findOne({ _id: mongodb.ObjectID(_id) });
      return foundUser;
    },
  },
  Mutation: {
    addUser: async (parent, { email, name, username, password }) => {
      try {
        const users = await loadMongoCollection('Users');
        await users.insertOne({
          name: name,
          email: email,
          username: username,
          password: password,
        });

        return "status: 'ok'";
      } catch (e) {
        return e;
      }
    },
    deleteUser: async (parent, { _id }) => {
      try {
        const users = await loadMongoCollection('Users');
        await users.deleteOne({
          _id: mongodb.ObjectID(_id),
        });
        return "status: 'ok'";
      } catch (e) {
        return e;
      }
    },
    updateUser: async (parent, args) => {
      try {
        const users = await loadMongoCollection('Users');
        // Create new object to apply & remove id key
        const { _id } = args;
        let updated = Object.assign({}, args);
        delete updated['_id'];
        await users.updateOne(
          {
            _id: mongodb.ObjectID(_id),
          },
          {
            $set: updated,
          }
        );
        return "status: 'ok'";
      } catch (e) {
        console.log(e);
        return e;
      }
    },
  },
};

const server = new GraphQLServer({ typeDefs, resolvers });
server.start(({ port }) => {
  console.log(`Server started on port: ${port}`);
});
