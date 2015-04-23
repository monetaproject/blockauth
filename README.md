## What is BlockAuth...?

BlockAuth provides a way for individuals to control their identity.

It is an extremely early working prototype that provides a way for users to self-manage their own registrations and authenticate with other services without being forced to provide an email address whilst also allowing the individual to choose just how much of their identity they reveal in the process.

## The Specification

The specfication is changing on a daily, sometimes hourly basis and has been opened to thepublic as early as possible in the hope of getting more people involved in the idea.

#### Registration Specifications

The following fields are required for registration:

* __Display Name__ (this is stored publicly in the blockchain and can be called by external services later)
* __Username__ (a SHA256 of this is sent to the server to be used for to help form the `uid`)
* __Password__ (a SHA256 of this is sent to the server to be used with the `uid` to further SHA256 the password)

The folloeing fields are optional:

* Blockchain (choose which blockchain you want to record the encoded message)

On the server side, the following then occurs:

* __UID__ = Additional SHA256(user_salt + hashed_username)
* __PASSWORD__ = Additional SHA256(UID + hashed_password)
* __ADDRESS HASH__ = Additional SHA256(address_salt + UID + PASSWORD)

The server should return a JSON object as follows:

<!--pre-javascript-->
```
{
    hash: "ADDRESS_HASH",
    address: "DEFAULT_RETURN_ADDRESS_SET_BY_CONFIG"
}
```

Please note that the salts for the demo below are currently set as follows:

<!--pre-javascript-->
```
{
    cookie: 123,
    username: 456,
    address: 789
}
```

This provides flexibility and some form of future-proofing to either allow for different version numbers of specifications and (or) external services to force indepednent registrations. Since the salts are server side, they are theoretically difficult to obtain and make brute force upon the password much more difficult.

Wish the hash obtained, we can use this client-side to generate a new address and then periodically poll that address to ascertain whether it has any unspent transactions, the moment it does, all of the balance is returned to the appropriate address and the login credentials are encoded into the `op_return` for that transaction.

The private key belonging to the newly generated address is used to further hash the UID:

<!--pre-javascript-->
```
var uid = bitcoin.crypto.sha256(private_key + uid).toString('hex');
```

The final `uid` is then used to hash the password prior to it being encoded in the `op_return`:

<!--pre-javascript-->
```
var stored_password = bitcoin.crypto.sha256(uid + password).toString('hex');
```

The UID should be returned to the user and a JSON string added to the `op_return` as follows:

<!--pre-javascript-->
```
{
    "n": "DISPLAY_NAME",
    "pw": "PASSWORD_TRIMMED_TO_FIT_OP_LIMIT"
}
```

Please note that the length of the final password stored is dependent upon the length of the display name stored.

Once the transaction has been completed, the relevant TXID should also be returned to the user along with the UID and (optional) relevant blockchain as follows:

* __UID__ = 86e0ae3dfc5adf865b8ddbfe669fee1d2916ddda3e28ce83ed3ca489a0b6fd4b
* __PWID__ (The Transaction ID) = 57068f4ffba9f08308ef2c2769f425233a68c11199e872336232d2a08e6a4e8f
* __CHAIN__ = doget (representing Dogecoin Testnet)

If remembering a UID and PWID (on-top of the actual password) is too much, you can choose to use [DN-Keys](http://dnkey.org), which allow you to simply remember a username and password, but by doing so publicly via DNS TXT records you also reveal slightly more about who you are in the process.

-----

#### DN-Key Specifications

A registration process that supports DN-Keys should also return something similar to this:

<!--pre-html-->
```
dnkey-blockauth-doget=86e0ae3dfc5adf865b8ddbfe669fee1d2916ddda3e28ce83ed3ca489a0b6fd4b_57068f4ffba9f08308ef2c2769f425233a68c11199e872336232d2a08e6a4e8f
```

Adding the above record to the DNS TXT record for `your-name.your-domain.com` sets that as your username. Having a username allows you to replace the need for remembering the UID and PWID and simply remember your sub-domain instead, which could be as simple as `bob.dnkey.me` for example.

-----

#### Authenticatin Specifications

If the client support DN-Keys, all you need to input is as follows:

* DN-Key
* Password

If the client does not support DN-Keys, the required fields (otherwise ascertained from the DN-Key results) are as follows:

* UID
* PWID (transaction ID containing credentials)
* Blockchain Used
* Password

The DN-Key also contains the UID, PWID and Blockchain Used.

The PWID is the transaction containing the credentials.

Looking it up via an [API](http://api.blockstrap.com/v0/doget/transaction/id/57068f4ffba9f08308ef2c2728f425233a68c11199e872336232d2a08e6a4e8f?showtxnio=1&prettyprint=1) should result in seeing outputs similar to the following:

<!--pre-javascript-->
```
outputs: [
    {
        pos: 0,
        script_pub_key: "76A9145EBC3C0FF4955F96E3F4940B0749CCEAA1E5186888AC",
        pubkey_hash: "5EBC3C0FF4955F96E3F4940B0749CCEAA1E51868"
    },
    {
        pos: 1,
        script_pub_key: "6A4C4F7B226E223A224D61726B20536D616C6C6579222C227077223A22333736643762626261386266386563613736333235623135316164623739666135343730643635653364333465383132373837227D",
        pubkey_hash: null
    }
]
```

Please notice the `script_pub_key` on line 09. When decoded, it reads:

<!--pre-html-->
```
OP_RETURN 7b226e223a224d61726b20536d616c6c6579222c227077223a22333736643762626261386266386563613736333235623135316164623739666135343730643635653364333465383132373837227d
```

When the hex value following the OP_RETURN is decoded, you should find the following JSON:

<!--pre-javascript-->
```
{
    n: "Mark Smalley",
    pw: "376d7bbba8bf8eca76325b151adb79fa5470d65e3d34e812787"
}
```

The current capacity for this method is 80 Bytes, which is __fully__ utilized by the current implementation.

This restriction of 80 bytes applies to blockchains from Bitcoin, Litecoin, Dogecoin and DashPay.

__You may be asking why we require a UID and PWID...?__

The hashed password that is stored on the blockchain uses the UID as part of the hashing process, so do not want to have that saved in the same location as the encoded transaction, else it would be possible to randomly brute-force any encoded transactions found. The use of the DN-Key allows you to store the UID in the same place that a reference to the hashed password can be found. However, although this makes the process of remembering your credntials much easier, replacing the UID and PWID with a simple username also exposses the link between the UID and password.

We are working on a new version of the specification, which will leave this attack vector less vulnerable.

## Examples & Demos

Please note that if you are visting this documentation from [blockauth.org](http://blockauth.org) there is a basic example that can be seen working below, which is also included within the [public repo](https://github.com/Neuroware-IO/blockauth) that powers this website. The documentation seen on [blockauth.org](http:/blockauth.org) is the same README-powered documentation seen within the public [GitHub](https://github.com/Neuroware-IO/blockauth) repository.

## Caveats

This is extremely experiemental stuff that should not yet be used in production.

Over the coming days, we will list all known flaws.

## More Information

More infomration can be seen within the following additional README files:

* [BlockAuth Transaction Details](https://github.com/Neuroware-IO/blockauth/blob/master/docs/blockauth-tx-details.md)