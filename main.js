window.CP.PenTimer.MAX_TIME_IN_LOOP_WO_EXIT = 6000;

var w = 612;
var h = 612;
var bg = 0;
var charset = ["!", "\"", "#", "$", "%", "&", "'", "(", ")", "*", "+", ",", "-", ".", "/", "0", "1", "2", "3", "4", "5", "6", "7", "8", "9", ":", ";", "<", "=", ">", "?", "@", "A", "B", "C", "D", "E", "F", "G", "H", "I", "J", "K", "L", "M", "N", "O", "P", "Q", "R", "S", "T", "U", "V", "W", "X", "Y", "Z", "[", "\\", "]", "^", "_", "`", "a", "b", "c", "d", "e", "f", "g", "h", "i", "j", "k", "l", "m", "n", "o", "p", "q", "r", "s", "t", "u", "v", "w", "x", "y", "z", "{", "|", "}", " ", "~"];
var once;
var charH = 12;
var charW = charH * 0.75;
var userImage, defaultImage, imageASCII;
var mouseHold = false;
var imageLoaded = false;
var copyButton, saveButton;
var stringASCII, copyFade, copyFadeAlpha, copyMessage;
var chunkNumX, chunkNumY;


function setup() {
  let input = createFileInput(handleImage);
  createCanvas(w, h);  
  
  copyButton = createButton("Copy as Text")
  copyButton.mousePressed(copyASCII)
  
  saveButton = createButton("Save as Image")
  saveButton.mousePressed(saveImage)
  
  let charsetDisplay = createP("<b>Character set:</b> " + charset.join(""));
  
  textFont("Source Code Pro");
  textSize(charH);
  textStyle(BOLD);  
  imageMode(CENTER);
  
  chunkNumX = floor(width/charW);
  chunkNumY = floor(height/charH);
  once = true;
  copyFadeAlpha = 100;
  defaultImage = loadImage('https://placekitten.com/612/612', img => processImage(img))
}

function draw() {
  if (once) {    
    getCharacterBrightnesses();
    once = false;
  }

  if (!imageLoaded) {
  } else {
    if (imageASCII && !mouseHold) {
      drawASCII(imageASCII);
    } else {
      image(userImage, width/2, height/2);
    }
  }
  
  if (copyFade) {
    copyFadeAlpha = (copyFadeAlpha - 3);
    showCopyMessage();
  }
}

function mousePressed() {
  if (mouseX > 0 && mouseX <= width && mouseY > 0 && mouseY <= height) {
    mouseHold = true;
    console.log("mouseHold: " + mouseHold);
  }
}
function mouseReleased() {
  if (mouseX > 0 && mouseX <= width && mouseY > 0 && mouseY <= height) {
    mouseHold = false;
    console.log("mouseHold: " + mouseHold);
  }
}
function mouseClicked() {
  if (mouseX > 0 && mouseX <= width && mouseY > 0 && mouseY <= height) {
    imageLoaded = true;
    console.log("mouse Clicked!");
  }
}

function getCharacterBrightnesses() {
  background(bg);
  fill(255);
  let charsetWidth = floor(width/charW);
  let tempCharset = [];
  let minCharBrightness = 255 * charW * charH;
  let maxCharBrightness = 0;

  // Loop through each character
  for(let y= 0; y < charsetWidth; y++) {    
    for(let x = 0; x < charsetWidth; x++) {
      let loc = x + y * charsetWidth;
      if (loc >= charset.length)
        break;

      // Draw Character
      let char = new Character(charset[loc]);

      text(charset[loc], x*charW, y*charH, textSize());
      
      // Create image of character
      let charImg = get(x*charW,y*charH, charW, charH);
      charImg.loadPixels()
      char.brightness = getAverageBrightness(charImg, charW, charH)

      maxCharBrightness = char.brightness > maxCharBrightness ? char.brightness : maxCharBrightness;
      minCharBrightness = char.brightness < minCharBrightness ? char.brightness : minCharBrightness;      

      tempCharset.push(char)
    }
  }
  
  tempCharset.forEach((val) => val.brightness = 255 - map(val.brightness, minCharBrightness, maxCharBrightness, 0, 255));
  charset = tempCharset.sort((a, b) => (a.brightness > b.brightness) ? 1 : -1);
}


function processImage(img) {
  userImage = coverImage(img);
  image(userImage, width/2, height/2)
  let chunkList = [];
  let minImageBrightness = 255 * chunkNumX * chunkNumY;
  let maxImageBrightness = 0;

  for (let y = 0; y < chunkNumY; y++) {
    for (let x = 0; x < chunkNumX; x++) {
      let chunk = new Chunk(x * charW, y * charH);
      // stroke(255,0,0);
      // noFill();
      // rect(chunk.x, chunk.y, charW, charH)

      let chunkImage = userImage.get(chunk.x, chunk.y, charW, charH);
      let chunkInfo = getAverageBrightness(chunkImage, charW, charH, true)
      chunk.brightness = chunkInfo.brightness;
      chunk.color = chunkInfo.color;

      maxImageBrightness = chunk.brightness > maxImageBrightness ? chunk.brightness : maxImageBrightness;
      minImageBrightness = chunk.brightness < minImageBrightness ? chunk.brightness : minImageBrightness; 

      chunkList.push(chunk);
    }
  }
  
  chunkList.forEach(function(val) {
    val.brightness = map(val.brightness, minImageBrightness, maxImageBrightness, 0, 255);   
    let tempCharset = charset;
    val.char = tempCharset.reduce((a,b) => abs(a.brightness - val.brightness) < abs(b.brightness - val.brightness) ? a : b);
  });
  
    imageLoaded = true;
    imageASCII = chunkList;
}

class Character {
  constructor(symbol) {
    this.symbol = symbol;
    this.brightness = 0;
  }
}

class Chunk {
  constructor(x, y) {
    this.x = x;
    this.y = y;
    this.brightness = 0;
    this.color = color(0);
    this.char = '';
  }
}

function getAverageBrightness(image, imageW, imageH, colorBoolean) {
  image.loadPixels();

  let imageBrightness = 0;
  let imageR = 0;
  let imageG = 0;
  let imageB = 0;
  for (let y = 0; y < imageH; y++) {
    for (let x = 0; x < imageW; x++) {
      // char[y].push(x + y * charW)
      let loc = x + y * imageW;
      let r = image.pixels[loc*4];
      let g = image.pixels[loc*4+1];
      let b = image.pixels[loc*4+2];
      let brightness = (r+g+b)/3;
      imageBrightness += brightness;
      if (colorBoolean) {
        imageR += r;
        imageG += g;
        imageB += b;
      }
    }
  }
  
  if(!colorBoolean){
    return imageBrightness;
  } else {
    imageR /= (imageW * imageH);
    imageG /= (imageW * imageH);
    imageB /= (imageW * imageH);
    return {
      brightness: imageBrightness,
      color: color(imageR, imageG, imageB)
    }
  }
}

function drawASCII(chunkList) {
  chunkList.forEach(function(chunk) {
    fill(255);
    // fill(chunk.color);
    noStroke();
    rect(chunk.x, chunk.y, charW, charH);
    fill(0); 
    fill(chunk.color); 
    textAlign(LEFT, TOP);
    text(chunk.char.symbol, chunk.x, chunk.y, charH)    
  })
}

function handleImage(file) {
  if (file.type == 'image') {
    userImage = loadImage(file.data, img => processImage(img));
  } else {
    alert("Please upload a valid file")
  }  
}

function coverImage(img) {
  // Factors to scale image size to canvas size in each dimension
  let widthFactor = width / img.width;
  let heightFactor = height / img.height;
  let scaleFactor = widthFactor > heightFactor ? widthFactor : heightFactor;
    
  image(img, width/2, height/2, img.width * scaleFactor, img.height * scaleFactor);
  return get();
}

function saveImage() {
  saveCanvas("ASCII");
}

function copyASCII() {
  stringASCII = "";
  let i = 0;
  imageASCII.forEach(function(val) {
    i++;
    stringASCII += val.char.symbol;
    if (i == chunkNumX) {
      i = 0;
      stringASCII += "\r\n"
    }
  });

  navigator.permissions.query({name: "clipboard-write"}).then(result => {
    if (result.state == "granted" || result.state == "prompt") {
      if (trim(stringASCII))
        navigator.clipboard.writeText(stringASCII).then(function() {
          copyFade = true;
          copyMessage = "ASCII Copied to Clipboard";
        }, function() {
          copyFade = true;
          copyMessage = "Copying to Clipboard failed, sorry!";
        });
      else {
        copyFade = true;
        copyMessage = "Copying to Clipboard failed, sorry!";
      }
    }
  });
  
  
}

function showCopyMessage() {
  let alpha = copyFadeAlpha / 100;
  
  fill(0,0,0, 150 * alpha);
  rect(0, 0, w, h);
  
  textAlign(CENTER, CENTER);
  fill(255,255,255, 255 * alpha);
  text(copyMessage, width/2, height/2);
  
  if (alpha <= 0.05){
    copyFade = false;
    copyFadeAlpha = 100;
  }
}