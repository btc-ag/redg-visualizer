# RedG Visualizer

This is the source code of the RedG Visualizer tool. Use it online at 
[btc-redg.github.com/redg-visualizer](https://btc-redg.github.com/redg-visualizer) or download and build it to use it offline.

# Browser support

Using Chrome/Chromium is recommended for the best user experience. Opera & Safari are untested but probably work well. Firefox will work, 
but SVG rendering performance when dragging is terrible. Internet Explorer is not officially supported.

# Documentation

See [here](https://btc-redg.github.com/redg-documentation/feature/visualization/) for a usage guide.

# Setup

Clone the repository and install all dependencies. [Yarn](https://yarnpkg.com) is recommended as an NPM alternative.
Run `yarn` (or `npm install`) inside the cloned directory.

# Build the webpack bundle

Run `yarn run build` (or `npm run build`) to create a standalone build. The generated files will be placed in the `dist` directory.
Open the `index.html` in your browser and everything works just like the online version.

# Run the development server

Run `yarn run start` to start the `webpack-dev-server`. After saving a CSS or TypeScript file, webpack will rebuild the bundle and
reload your browser window.
