## BlockAuth Transaction Details

The current specification will result in a [transaction](http://api.blockstrap.com/v0/doget/transaction/id/08a92044c4b6558736232690de6d58c65299771120a2b20bbdd3df2909718f17?showtxnio=1&prettyprint=1) that has an additional output utilizing `op_return` as follows:

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

```
OP_RETURN 7b226e223a224d61726b20536d616c6c6579222c227077223a22333736643762626261386266386563613736333235623135316164623739666135343730643635653364333465383132373837227d
```

When the hex value preceeding the OP_RETURN is decoded, you should find the following JSON:

<!--pre-javascript-->
```
{
    n: "Mark Smalley",
    pw: "376d7bbba8bf8eca76325b151adb79fa5470d65e3d34e812787"
}
```

The current capacity for thos method is 80 Bytes and is __fully__ utilized above.

This same restriction of 80 bytes applies to Bitcoin, Litecoin, Dogecoin and DashPay.