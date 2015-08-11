module.exports = {
  PngImage(data) {
    var toInt32 = function(bytes) {
      return (bytes[0] << 24) | (bytes[1] << 16) | (bytes[2] << 8) | bytes[3];
    }
  
    var base64Text = data.toString('base64');
    return {
      width: toInt32(data.slice(16, 20)),
      height: toInt32(data.slice(20, 24)),
      data: data,
      base64: base64Text,
      uri: "data:image/" + 'png' + ";base64," + base64Text
    }
  }
}
