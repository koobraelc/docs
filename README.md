# ArtBlocks 101 for Creators

## How does it all work?

The Art Blocks platform hosts generative projects for the production of verifiably deterministic outputs. A generative script (using [p5js](https://p5js.org/) for example) is stored immutably on the Ethereum blockchain for each project. When a user wants to purchase an iteration of a project hosted on the platform, they purchase an ERC721 compliant "non-fungible" token, also stored on the Ethereum blockchain, containing a provably unique "seed" which controls variables in the generative script. These variables, in turn, control the way the output looks and operates.

Each "seed", also known as a "hash string" is a hexadecimal string generated in a pseudo-random manner at the time the token is minted. Each character (0-9, a-f) represents a value from 0-15 and each pair of characters ("aa", or "f2") represents a value from 0-255.

For example:

```javascript
"0x11ac128f8b54949c12d04102cfc01960fc496813cbc3495bf77aeed738579738"
```

This hash will be the source of entropy or variation use to determine the output of your algorithm. When your art is rendered on ArtBlocks, your script will have access to a global variable called `tokenData`. One of the first lines in your script should be to read in the hash from this variable.

```javascript
let hash = tokenData.hash
```

When you are testing locally, this variable obviously will not be defined in your browser environment. Thus here is a simple function to generate valid hashes.

```javascript
function random_hash() {
  let chars = "0123456789abcdef";
  let result = '0x';
  for (let i = 64; i > 0; --i) result += chars[Math.floor(Math.random() * chars.length)];
  return result;
}

tokenData = {"hash": random_hash()}
```

There are two primary ways to use this hash:

### Convert the hash to a large integer

The first method is to convert the hash into a large integer and use this to seed a pseudo random number generator (PRNGs). You want to consider PRNGs based on arithmetic to ensure your output is determistic regardless of the JavaScript version being used in a given browser. For example, do not use this to seed the `Math.random()` function because it's hard to say how this might change in the future.

```javascript
let seed = parseInt(tokenData.hash.slice(0, 16), 16);
```

While also keeping in mind: "Anyone who considers arithmetical methods of producing random digits is, of course, in a state of sin." - [John von Neumann](https://en.wikipedia.org/wiki/John_von_Neumann)

That quote aside, here is a basic PRNG that works well for most purposes.

```javascript
class Random {
  constructor(seed) {
    this.seed = seed
  }
  random_dec() {
    this.seed ^= this.seed << 13
    this.seed ^= this.seed >> 17
    this.seed ^= this.seed << 5
    return ((this.seed < 0 ? ~this.seed + 1 : this.seed) % 1000) / 1000
  }
  random_between(a, b) {
    return a + (b - a) * this.random_dec()
  }
  random_int(a, b) {
    return Math.floor(this.random_between(a, b+1))
  }
  random_choice(x) {
    return x[Math.floor(this.random_between(0, x.length * 0.99))]
  }
}
```

Here is a very basic PRNG that can extract a decent amount of variation out of a large integer for most projects. Everytime one of the `random` functions is called, the seed is modified in a predictable way. Thus every _sequence_ of calls will return the exact same number.

We can seed it with our parsed hash string like so:

```javascript
let R = new Random(seed)
```

Now each time we need some randomness we can call various helper functions:

```javascript
R.random_between(0, 10)
R.random_int(0, 1)
R.random_choice(["a", "b", "c"])
```

Every time one of these functions is called, `random_dec()` will also be called somewhere in the stack. Applying the determistic arithmetic to the seed and returning a new random number.

### Create a series of hex pairs

Alternatively, you could just extract numbers from each of the hex pairs to parameterize your algorithm. Here we extract pairs and parse them into integers from 0-256. If we want them these values to range only between 0-10 for example we can do the following:

```javascript
let seed = parseInt(tokenData.hash.slice(0, 16), 16);
let p = [];
for (let j = 0; j < 32; j++) {
     p.push(tokenData.hash.slice(2 + (j * 2), 4 + (j * 2)));
}
let rns = p.map(x => {
     return parseInt(x, 16) % 10;
});
```

These can be used to parameterize different variables later on:

```javascript
let dynamic = rns[0] > 9
let size = rns[1] > 5 ? 10 : 20
let color = rns[2] > 7 ? "white" : "black"
```

## Guidelines and Constraints

Now you have the basics here are some general principles you need to consider when making your art. 

### Deterministic
Each output must be determistic based on a single hash. More specifically, the initial output or frame must be the same. If your piece is animated, some randomness is okay. This is so when the art is rendered as an image (e.g. for OpenSea) it is always the same.

### Dimensionless
The output must be dimension agnostic. Meaning it scales seamlessly to any dimension. While you can control the dimension ratio (e.g. width/height can be 1.0, 1.5, 0.75 etc.) you have no control over the dimensions of the browser someone else might be using. The output will be rendered by the server at 2400x2400 (see below for ratios other than 1) and typically displayed in most browsers at 1000x1000 but your output should be the same at higher resolutions. Obviously, at lower resolutions, fewer pixels may limit what your output looks like, such as the smoothness of lines, which is okay. This is mainly to ensure your work can be reproduced at print quality.

A simple way to account for this is to define a default dimension and create a multiplier to scale coordinates or sizes relative to the canvas dimensions. I'll use p5.js as an example but the same principle applies regardless of the language.

```javascript
var DEFAULT_SIZE = 1000
var WIDTH = window.innerWidth
var HEIGHT = window.innerHeight
var DIM = Math.min(WIDTH, HEIGHT)
var M = DIM / DEFAULT_SIZE

function setup() {
     createCanvas(WIDTH, HEIGHT)
     rect(100*M, 500*M, 50*M, 50*M)
}
```

### Cost
Storing code on Ethereum is expensive! Taking average gas prices, you can generally expect to pay ~$10 for each full line of code your script requires. With that in mind - keep things efficient, maximize code reuse with functions, remove comments, and minify your finished code.


## Testing on Rinkeby

Once your script is ready, you will test it out on an [ArtBlocks](https://rinkeby.artblocks.io/) clone site running on one of Ethereum's test networks (Rinkeby). This will make sure there aren't any bugs or errors and that if it's working on Rinkeby, it will work on Mainnet. You can connect to this site by changing the network in your browser wallet (e.g. the very top button of MetaMask). You'll still be using the same wallet and address, except on the test network.

Note: If you don't have "Rinkeby ETH" ask a mod or previous artist, we'll send you some to play with. Or if you don't feel like waiting, request some from the faucet: https://faucet.rinkeby.io/.

### Interacting with your Project
If you this far, we have probably requested from you a project name and an ethereum address. This is the address you will use on mainnet and on Rinkeby. So at this point change your network to Rinkeby in MetaMask.

Now check out your project, it probably looks like this `https://artblocks.io/project/5`. On Rinkeby, we'll practice uploading everything so that it all goes smooth on mainnet when the ETH is real. After loading the page and connecting your wallet, you should see a button labeled "Toggle Artist Interface". A multi-tabbed form will pop up. You only need to focused on the following:

#### Project
This should all be self-explanatory. Just fill and sumbit each one separately.

#### Token
In this tab you'll set the price and supply for your project. If you're accepting ETH as payment you don't need to worry about "Updated Currency Information". Although you can specify any ERC20-compliant token if you choose. Just give someone a heads up that you wish to go down this route.

#### Scripts
Here you'll first specify the dependency of your project including the script type and the version number of that script. For most scripts, you can leave the version blank or enter 1. The aspect ratio is a single number. E.g. 1 or 0.75 etc. If your piece takes a certain amount of time to fully render you can type in the animation length to let the server know when to render the canvas.

Once you've submitted your script details add your script to the "Project Script" box. Remember, `tokenData.hash` is a global variable in the environment this script will live in, so you do not need to define `tokenData` in your script, just expect your script will have access to it.

If your script is big, you can minify it here: https://javascript-minifier.com/

If your script is soo big that you cannot fit it in a single transaction (you're getting an error when you submit), you may need to split it up and submit each part subsequently.

#### URI
If you want to see how your mints look on OpenSea, you can see the BaseURI to `https://rinkebyapi.artblocks.io/token/`. This is optional but on mainnet you must set this to `https://api.artblocks.io/token/`

#### Finishing Actions
Once you're done let us know and we will activate the project. You can then click "Purchases Paused" to test out the minting. Once your test mints are working in the livescript view, mint 20-40.
