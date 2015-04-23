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

var blockauth = {
    // INITIALIZE
    init: function()
    {
        blockauth.buttons();
        blockauth.snippets();
        blockauth.forms();
    },
    buttons: function()
    {
        $('a.bs-auth-login').on('click', function(e)
        {
            e.preventDefault();
            $('html, body').animate({ scrollTop: 0 }, 350, function()
            {
                $('#modal-details').modal('hide');
                $('#modal-login').modal('show');
            });
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
            $('html, body').animate({ scrollTop: 0 }, 350, function()
            {
                location.reload();
            });
        });
    },
    details: function(txid, uid, chain)
    {
        $('#default-modal').modal('hide');
        $('#modal-details .txid').text(txid);
        $('#modal-details .uid').text(uid);
        $('#modal-details .chain').text(chain);
        $('#modal-details .dnkey').text('dnkey-blockauth-'+chain+'='+uid+'_'+txid);
        $('html, body').animate({ scrollTop: 0 }, 350, function()
        {
            $('#modal-details').modal('show');
        });
    },
    forms: function()
    {
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
                        if(k.substring(0, 'blockauth-'.length) == 'blockauth-')
                        {
                            var res = v[0];
                            var r_array = res.split('_');
                            var v_array = k.split('-');
                            var uid = r_array[0];
                            var chain = v_array[1];
                            var txid = r_array[1];
                            var pass = bitcoin.crypto.sha256(pw).toString('hex');
                            var password = bitcoin.crypto.sha256(uid+pass).toString('hex');
                            
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
                                            $('#modal-login').modal('hide');
                                            $('#default-modal').modal('hide');
                                            if(typed_password && pw_to_check && pw_to_check == typed_password)
                                            {
                                                title = 'Success';
                                                content = 'Welcome back <strong>'+name+'</strong>';
                                                $('#modal-login').modal('hide');
                                                $('#default-modal').modal('hide');
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
                    var pass = bitcoin.crypto.sha256(pw).toString('hex');
                    var password = bitcoin.crypto.sha256(uid+pass).toString('hex');
                    
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
                                        $('#modal-login').modal('hide');
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
                            $('#modal-login').modal('hide');
                            $('#default-modal').modal('hide');
                            $.fn.blockstrap.core.modal(title, content, 'modal');
                            $(button).removeClass('loading');
                        }
                    }, 'blockstrap', true);
                }
            });
        });
        $('form.bs-auth').on('submit', function(e)
        {
            e.preventDefault();
            var form = this;
            var button = $(form).find('button[type="submit"]');
            var address = $(form).find('input[name="address"]').val();
            var display_name = $(form).find('input[name="name"]').val();
            var username = $(form).find('input[name="username"]').val();
            var password = $(form).find('input[name="password"]').val();
            var password_repeat = $(form).find('input[name="password-repeat"]').val();
            var blockchain = $(form).find('select[name="chain"]').val();
            if(display_name && username && password && password_repeat && blockchain)
            {
                if(password != password_repeat)
                {
                    $.fn.blockstrap.core.modal('Warning', 'Password Mismatch');
                }
                else
                {
                    $(button).addClass('loading');
                    var pw = bitcoin.crypto.sha256(password).toString('hex');
                    var un = bitcoin.crypto.sha256(username).toString('hex');
                    $.ajax({
                        url: 'php/register.php',
                        data: {
                            name: display_name, 
                            username: un, 
                            chain: blockchain, 
                            password: pw, 
                            return_address: address
                        }, 
                        dataType: 'json',
                        method: 'post',
                        cache: false,
                        success: function(obj)
                        {
                            var hash = false;
                            var default_address = address;
                            if(typeof obj.hash != 'undefined') hash = obj.hash;
                            if(!address && typeof obj.address != 'undefined') address = obj.address;
                            if(hash)
                            {
                                var bs = $.fn.blockstrap;
                                var keys = bs.blockchains.keys(hash, blockchain);
                                var payment_form = $('#payment-form').html();
                                var minimum = parseFloat(bs.settings.blockchains[blockchain].fee * 100000000) * 2;
                                var chain_name = bs.settings.blockchains[blockchain].blockchain;
                                var uid = bitcoin.crypto.sha256(keys.priv+un).toString('hex');
                                
                                password = bitcoin.crypto.sha256(uid+pw).toString('hex');
                                $.fn.blockstrap.core.modal('Please Verify Registration', payment_form);
                                $('#default-modal').find('.minimum').text((minimum / 100000000) + ' ' +chain_name);
                                $('#default-modal').find('#verification-address').val(keys.pub);
                                blockauth.timeout(display_name, password, keys, address, blockchain, uid, 1);
                            }
                            else
                            {
                                $.fn.blockstrap.core.modal('Error', 'Unable to get hash');
                            }
                        }
                    });
                }
            }
            else
            {
                $.fn.blockstrap.core.modal('Warning', 'All Fields Required');
            }
        });
    },
    snippets: function()
    {
        $('*').contents().filter(function()
        {
            return this.nodeType == 8;
        }).each(function(i, e)
        {
            var contents = e.nodeValue;
            if(contents.indexOf('pre-') > -1)
            {
                var obj = contents.split('-');
                if(obj[0] == 'pre' && typeof obj[1] != 'undefined')
                {
                    $($(e).next()).snippet(obj[1], {style:'ide-eclipse'});
                }
            }
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
                            blockauth.details(obj.txid, uid, chain);
                        }
                    });
                }
                else
                {
                    blockauth.timeout(name, password, keys, return_address, chain, uid, 60000);
                }
            });
        }, timeout);
    }
};

$(document).ready(function()
{
    blockauth.init();
});