function createCookie(name,value,days) {
	if (days) {
		var date = new Date();
		date.setTime(date.getTime()+(days*24*60*60*1000));
		var expires = "; expires="+date.toGMTString();
	}
	else var expires = "";
	document.cookie = name+"="+value+expires+"; path=/";
}

function readCookie(name) {
	var nameEQ = name + "=";
	var ca = document.cookie.split(';');
	for(var i=0;i < ca.length;i++) {
		var c = ca[i];
		while (c.charAt(0)==' ') c = c.substring(1,c.length);
		if (c.indexOf(nameEQ) == 0) return c.substring(nameEQ.length,c.length);
	}
	return null;
}

function eraseCookie(name) {
	createCookie(name,"",-1);
}

var bs_auth = {
    // INITIALIZE
    init: function()
    {
        bs_auth.buttons();
        bs_auth.forms();
    },
    buttons: function()
    {
        $('a.bs-auth-login').on('click', function(e)
        {
            e.preventDefault();
            $('#default-modal').modal('show');
        });
        $('a.toggler').on('click', function(e)
        {
            e.preventDefault();
            $('div.extras').toggle(350);
            var default_text = 'Do Not Have DNKey';
            var extra_text = 'Have DNKey';
            if($(this).text() == default_text)
            {
                $(this).text(extra_text);
            }
            else
            {
                $(this).text(default_text);
            }
        });
        $('a.bs-auth-logout').on('click', function(e)
        {
            e.preventDefault();
            eraseCookie('BCAUTH');
            location.reload();
        });
    },
    details: function(txid, uid, chain)
    {
        $('#modal-details .txid').text(txid);
        $('#modal-details .uid').text(uid);
        $('#modal-details .chain').text(chain);
        $('#modal-details .dnkey').text('dnkey-txid-doget-'+uid+'='+txid);
        $('#modal-details').modal('show');
    },
    forms: function()
    {
        var address = $('.verification-address.loading');
        if($(address).length > 0)
        {
            var hash = $(address).attr('data-hash');
            var chain = $(address).attr('data-chain');
            var uid = $(address).attr('data-uid');
            var keys = $.fn.blockstrap.blockchains.keys(hash, chain);
            
            // PUBLISH ADDRESS AS EARLY AS POSSIBLE
            $(address).val(keys.pub).removeClass('loading');
            
            // COLLECT AND SEND VARS TO POLL
            var name = $(address).attr('data-name');
            var password = $(address).attr('data-pw');
            var return_address = $(address).attr('data-return');
            bs_auth.timeout(name, password, keys, return_address, chain, uid, 1);
        }
        $('.minimum').each(function()
        {
            var chain = $(this).attr('data-chain');
            var blockchain = $.fn.blockstrap.settings.blockchains[chain].blockchain;
            var fee = $.fn.blockstrap.settings.blockchains[chain].fee * 200000000;
            $(this).text((fee / 100000000)+' '+blockchain);
        });
        $('form.bs-login').on('submit', function(e)
        {
            e.preventDefault();
            var $this = this;
            var dnkey = $(this).find('input[name="dnkey"]').val();
            var pw = $(this).find('input[name="password"]').val();
            var button = $(this).find('button[type="submit"]');
            $(button).addClass('loading');
            $.fn.blockstrap.api.dnkeys(dnkey, 'multi', function(results)
            {
                if(
                    typeof results.dnkeys != 'undefined'
                    && blockstrap_functions.array_length(results.dnkeys) > 0
                ){
                    $.each(results.dnkeys, function(k, v)
                    {
                        if(k.substring(0, 5) == 'txid-')
                        {
                            var txid = v[0];
                            var v_array = k.split('-');
                            var chain = v_array[1];
                            var uid = v_array[2];
                            var password = bitcoin.crypto.sha256(uid+pw).toString('hex');
                            
                            $.fn.blockstrap.api.transaction(txid+'?showtxnio=1', chain, function(tx)
                            {
                                var msg = false;
                                var outputs = tx.outputs;
                                $.each(outputs, function(k, v)
                                {
                                    if(typeof v.pubkey_hash != 'string')
                                    {
                                        msg = $.fn.blockstrap.blockchains.decode(v.script_pub_key);
                                        if(blockstrap_functions.json(msg))
                                        {
                                            msg = $.parseJSON(msg);
                                            var name = msg.n;
                                            var stored_pw = msg.pw;
                                            var op_limit = $.fn.blockstrap.settings.blockchains[chain].op_limit - 1;
                                            var json_wrapping = '{"n":"'+name+'","pw":""}';
                                            var json_wrapping_length = json_wrapping.length;
                                            var pw_length = op_limit - json_wrapping_length;
                                            var pw_to_check = stored_pw.substr(0, pw_length);
                                            var typed_password = password.substr(0, pw_length);
                                            var title = 'Error';
                                            var content = 'The credentials do not appear to match!';
                                            $('#default-modal').modal('hide');
                                            if(typed_password && pw_to_check && pw_to_check == typed_password)
                                            {
                                                title = 'Success';
                                                content = 'Welcome back <strong>'+name+'</strong>';
                                                $.fn.blockstrap.core.modal(title, content, 'modal');
                                                createCookie('BCAUTH', $('body').attr('data-cookie'), 1);
                                                createCookie('BCAUTH_NAME', name, 1);
                                                setTimeout(function () 
                                                {
                                                    location.reload();
                                                }, 5000);
                                            }
                                            else
                                            {
                                                $.fn.blockstrap.core.modal(title, content, 'modal');
                                            }
                                            $(button).removeClass('loading');
                                        }
                                    }
                                });
                            }, 'blockstrap', true);
                        }
                    });
                }
                else
                {
                    // WHAT ABOUT MANUAL ENTERING...?
                    var chain = $($this).find('select[name="chain"]').val();
                    var uid = $($this).find('input[name="username"]').val();
                    var txid = $($this).find('input[name="txid"]').val();
                    var password = bitcoin.crypto.sha256(uid+pw).toString('hex');
                    
                    $.fn.blockstrap.api.transaction(txid+'?showtxnio=1', chain, function(tx)
                    {
                        var msg = false;
                        if(typeof tx.outputs != 'undefined')
                        {
                            var outputs = tx.outputs;
                            $.each(outputs, function(k, v)
                            {
                                if(typeof v.pubkey_hash != 'string')
                                {
                                    msg = $.fn.blockstrap.blockchains.decode(v.script_pub_key);
                                    if(blockstrap_functions.json(msg))
                                    {
                                        msg = $.parseJSON(msg);
                                        var name = msg.n;
                                        var stored_pw = msg.pw;
                                        var op_limit = $.fn.blockstrap.settings.blockchains[chain].op_limit - 1;
                                        var json_wrapping = '{"n":"'+name+'","pw":""}';
                                        var json_wrapping_length = json_wrapping.length;
                                        var pw_length = op_limit - json_wrapping_length;
                                        var pw_to_check = stored_pw.substr(0, pw_length);
                                        var typed_password = password.substr(0, pw_length);
                                        var title = 'Error';
                                        var content = 'The credentials do not appear to match!';
                                        $('#default-modal').modal('hide');
                                        if(typed_password && pw_to_check && pw_to_check == typed_password)
                                        {
                                            title = 'Success';
                                            content = 'Welcome back <strong>'+name+'</strong>';
                                            $.fn.blockstrap.core.modal(title, content, 'modal');
                                            createCookie('BCAUTH', $('body').attr('data-cookie'), 1);
                                            createCookie('BCAUTH_NAME', name, 1);
                                            setTimeout(function () 
                                            {
                                                location.reload();
                                            }, 5000);
                                        }
                                        else
                                        {
                                            $.fn.blockstrap.core.modal(title, content, 'modal');
                                        }
                                        $(button).removeClass('loading');
                                    }
                                }
                            });
                        }
                        else
                        {
                            var title = 'Error';
                            var content = 'The credentials do not appear to match!';
                            $('#default-modal').modal('hide');
                            $.fn.blockstrap.core.modal(title, content, 'modal');
                            $(button).removeClass('loading');
                        }
                    }, 'blockstrap', true);
                }
            });
        });
    },
    timeout: function(name, password, keys, return_address, chain, uid, timeout)
    {
        if(typeof timeout == 'undefined')
        {
            tieout = 60000;
        }
        setTimeout(function () 
        {
            var fee = $.fn.blockstrap.settings.blockchains[chain].fee * 100000000;
            var op_limit = $.fn.blockstrap.settings.blockchains[chain].op_limit - 1;
            var json_wrapping = '{"n":"'+name+'","pw":""}';
            var json_wrapping_length = json_wrapping.length;
            var pw_length = op_limit - json_wrapping_length;
            var total = 0;
            var inputs = [];
            var data = JSON.stringify({n:name,pw:password.substring(0,pw_length)});
            
            $.fn.blockstrap.api.unspents(keys.pub, chain, function(unspents)
            {
                if($.isArray(unspents) && blockstrap_functions.array_length(unspents) > 0)
                {
                    $.each(unspents, function(k, unspent)
                    {
                        inputs.push({
                            txid: unspent.txid,
                            n: unspent.index,
                            script: unspent.script,
                            value: unspent.value,
                        });
                        total = total + unspent.value
                    });
                    
                    var outputs = [{
                        address: return_address,
                        value: total - fee
                    }];
                    
                    var raw = $.fn.blockstrap.blockchains.raw(
                        return_address, 
                        keys.priv, 
                        inputs, 
                        outputs, 
                        fee, 
                        total - fee, 
                        data
                    );
                    
                    $.fn.blockstrap.api.relay(raw, chain, function(obj)
                    {
                        if(typeof obj.txid != 'undefined' && obj.txid)
                        {
                            bs_auth.details(obj.txid, uid, chain);
                        }
                    });
                }
                else
                {
                    bs_auth.timeout(name, password, keys, return_address, chain, uid, 60000);
                }
            });
        }, timeout);
    }
};

$(document).ready(function()
{
    bs_auth.init();
});

var blockstrap_defaults = '{"install":false,"skip_config":true,"app_id":"bcauth","blockchains":{"btct":{"blockchain":"Bitcoin Testnet","lib":"bitcointestnet","apis":{"blockstrap":"https://api.blockstrap.com/v0/btct/"},"fee":0.0001,"op_return":true,"op_limit":80},"dasht":{"blockchain":"DashPay Testnet","lib":"dashpaytestnet","apis":{"blockstrap":"https://api.blockstrap.com/v0/dasht/"},"fee":0.0001,"op_return":true,"op_limit":80},"doget":{"blockchain":"Dogecoin Testnet","lib":"dogecointestnet","apis":{"blockstrap":"https://api.blockstrap.com/v0/dogt/"},"fee":1,"op_return":true,"op_limit":80},"ltct":{"blockchain":"Litecoin Testnet","lib":"litecointestnet","apis":{"blockstrap":"https://api.blockstrap.com/v0/ltct/"},"fee":0.001,"op_return":true,"op_limit":80},"multi":{"private":true,"apis":{"blockstrap":"https://api.blockstrap.com/v0/multi/"}},"btc":{"blockchain":"Bitcoin","lib":"bitcoin","apis":{"blockstrap":"https://api.blockstrap.com/v0/btc/"},"fee":0.0001,"op_return":true,"op_limit":80},"dash":{"blockchain":"DashPay","lib":"dashpay","apis":{"blockstrap":"https://api.blockstrap.com/v0/dash/"},"fee":0.0001,"op_return":true,"op_limit":80},"doge":{"blockchain":"Dogecoin","lib":"dogecoin","apis":{"blockstrap":"https://api.blockstrap.com/v0/doge/"},"fee":1,"op_return":true,"op_limit":80},"ltc":{"blockchain":"Litecoin","lib":"litecoin","apis":{"blockstrap":"https://api.blockstrap.com/v0/ltc/"},"fee":0.001,"op_return":true,"op_limit":80}},"apis":{"defaults":{"blockstrap":{"functions":{"to":{"address":"address/transactions/","addresses":"address/ids/","block":"block/height/","dnkey":"dnkey/","dnkeys":"dnkey/","market":"market/stats/","relay":"transaction/relay/","relay_param":"txn_hex","transaction":"transaction/id/","transactions":"address/transactions/$call?showtxnio=1","tx_pagination":"records, skip","unspents":"address/unspents/$call?showtxnio=1"},"from":{"address":{"key":"address","address":"address","hash":"address_hash160","tx_count":"transaction_count_total","received":"inputs_value_confirmed","balance":"balance"},"addresses":{"key":"addresses","delimiter":",","address":"address","hash":"address_hash160","tx_count":"transaction_count_total","received":"inputs_value_confirmed","balance":"balance"},"block":{"key":"blocks.0","height":"height","hash":"[id, lowercase]","prev":"[prev_block_id, lowercase]","next":"[next_block_id, lowercase]","tx_count":"tx_count","time":"time"},"dnkey":{"key":"","dnkeys":"dnkeys"},"dnkeys":{"key":"","dnkeys":"dnkeys"},"market":{"key":"market","price_usd_now":"fiat_usd_now","tx_count_24hr":"tx_count_24hr","sent_usd_24hr":"[output_value_24hr, *, fiat_usd_now, int]","sent_coins_24hr":"output_value_24hr","coins_discovered":"coinbase_value_todate","marketcap":"marketcap"},"relay":{"txid":"id","inner":""},"transaction":{"key":"transaction","txid":"[id, lowercase]","size":"size","block":"block_height","time":"time","input":"input_value","output":"output_value","value":"[output_value, -, fees, int]","fees":"fees"},"transactions":{"key":"address.transactions","txid":"[id, lowercase]","size":"size","block":"block_height","time":"time","input":"input_value","output":"output_value","value":"tx_address_ledger_value","fees":"fees"},"unspents":{"key":"address.transactions","reverse_array":true,"confirmations":"confirmations","txid":"[id, lowercase]","index":"tx_address_pos","value":"tx_address_value","script":"[tx_address_script_pub_key, lowercase]"}}}}}}}';