# Simple data import

An example for importing simple JSON data to Graphcool. There is also a [full guide](https://graph.cool/docs/guides/importing-simple-data-using-a-script).

## Getting started

### 1. Create an account

To run this example, please create a [Graphcool](http://graph.cool) account and **copy your endpoint**. This shouldn't take longer than a minute. We promise!

![](http://i.imgur.com/ytXDR4B.gif)

This is how our GraphQL data model looks like:

```graphql
type Movie {
  description: String!
  oldId: String!
  released: DateTime!
  title: String!
}
```

### 2. Configure app data endpoint

Open `import-movies-actors.js` and paste your `PROJECT_ID` to the following line:

```js
const client = new Lokka({
  transport: new Transport('https://api.graph.cool/simple/v1/__PROJECT_ID__')
})
```

### 3. Run the example

You're done configuring the example application. To run the script, make sure your node version is at least 7:

```sh
node -v
```

Then you can execute `import-movies-actors.js` with the `--harmony-async-await` parameter to enabled `async` and `await`:

```sh
node --harmony-async-await import-movies-actors.js
```

## Help & Community [![Slack Status](https://slack.graph.cool/badge.svg)](https://slack.graph.cool)

Join our [Slack community](http://slack.graph.cool/) if you run into issues or have questions. We love talking to you!

![](http://i.imgur.com/5RHR6Ku.png)
