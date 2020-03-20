async function main(){
  const chain = require ('./chain')
  let datos = await chain.createAccount()
  console.log(JSON.parse(JSON.stringify(datos)))

  await chain.send(datos.address, 2, 'BNB', 'fe1e90a1945fc78d2b1ec5e3a7b21af477e959ac699609789bc30656ed707989')
  setTimeout(function() {
      console.log('Esperaa.a.aaaa.a.a.....aaa');
  }, 1000);
  await chain.send('tbnb1n9w53lsjhctuxh0dd2aemnj75tejxlase6dy33', 1, 'BNB', datos.privateKey)

}

main()
