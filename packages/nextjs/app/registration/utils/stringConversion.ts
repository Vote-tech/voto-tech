function hexStringToUint8Array(hexString: string): Uint8Array {
    const arr = []
    for (let i = 0; i < hexString.length; i += 2) {
      arr.push(parseInt(hexString.substr(i, 2), 16))
    }
    return new Uint8Array(arr)
  }
  
  export { hexStringToUint8Array }