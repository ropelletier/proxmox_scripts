var domain;

chrome.runtime.onMessage.addListener(function(request, sender) {

    if (request.action == "getSource") {
      cartHtml = request.source;
      console.log(cartHtml);
      chrome.tabs.query({
            active: true,
            lastFocusedWindow: true
        },
        tabs => {
            url = tabs[0].url;            
            // newUrl = url.split('?')[0] 
            cartUrl = url.split('/')[4]
            wbUrl = url.split('/')[3]   
            spUrl = (url.split('/')[3]).split('?')[0]       
            console.log('cartUrl: ' + cartUrl);
            console.log('spUrl: ' + spUrl);
            newUrl = url.split('/')[2].split('.')[1]
            console.log('wbUrl: ' + wbUrl);
            console.log('newUrl: ' +newUrl);
            if ((newUrl == 'amazon' && cartUrl == 'cart') || 
            (newUrl == 'wbmason' && wbUrl == 'ShoppingCart.aspx') ||
            (newUrl == 'homedepot' && wbUrl == 'mycart') ||
            (newUrl == 'schoolspecialty' && ( spUrl == 'AjaxOrderItemDisplayView' || spUrl == 'SavedOrderDetailView' || spUrl == 'SubmitOnBehalfOfCartPage' ))
            ) { 
                $('#export-button').hide(500); 
                // $('#loader').show(500); 
            //    scrapedData = scrapMatchDetails(cartHtml).join('')
            if (newUrl == 'amazon'){
                scrapedData = scrapAmazonMatchDetails(cartHtml);
                $('a.excel').attr("download", "cart-details-"+newUrl+".csv");
            }
            if (newUrl == 'homedepot'){
                scrapedData = scrapHDMatchDetails(cartHtml);
                $('a.excel').attr("download", "cart-details-"+newUrl+".csv");
            }
            if (newUrl == 'wbmason'){
                scrapedData = scrapWBMasonMatchDetails(cartHtml);
                $('a.excel').attr("download", "cart-details-"+newUrl+".csv");
            }
            if (newUrl == 'schoolspecialty'){
                scrapedData = scrapSPMatchDetails(cartHtml);
                $('a.excel').attr("download", "cart-details-"+newUrl+".csv");
            }
            
			 if(scrapedData != 0)

                if (typeof scrapedData.tyler !== 'undefined' ){                 

                    tylerScrapedDataRaw = scrapedData.tyler;
                    tylerScrapedData = JSON.parse(scrapedData.tyler);

                    //Jhxlsx.export(tylerScrapedData.tableData, tylerScrapedData.options);
                    scrapedData = scrapedData.bb;
                    scrapedData = scrapedData.join('');                     
 
                } else {
                    scrapedData = scrapedData.join('');     
                }				            
   		
				if(scrapedData == 0){
				    $('#cart-message').show(500);	
				} else if (scrapedData != 'ID%2CLink%2CTitle%2CQuantity%2CPrice%0A') { 
                    $('.excel').attr('href', 'data:application/csv;charset=utf-8,'+scrapedData);
                    $('#export-button').show(500); 
                    if(typeof tylerScrapedData !== 'undefined' ){
                        $('.tyler-excel').attr('data', tylerScrapedDataRaw);
                        $('#tyler-export-button').show(500); 
                    }
                } else {
                    $('#cart-message').show(500);
                }
                $('#loader').hide(500);
            }else{
                $('#alert-message').show(500);
            }
        });
    }
});

function onWindowLoad() { 
chrome.tabs.query({
    active: true,
    lastFocusedWindow: true
}, function(tabs) {
      var tab = tabs[0];
      var str = tab.url;
      var n = str.search("cart");
      var b = str.search("ShoppingCart");
      var c = str.search("AjaxOrderItemDisplayView");
      var d = str.search("SavedOrderDetailView");
      var e = str.search("SubmitOnBehalfOfCartPage");
      
	   var url = new URL(tab.url);
	   domain = url.hostname;

       console.log(domain);
       
     if((n == -1 && b == -1 && c == -1 && d == -1 && e == -1) || domain == 'chrome.google.com'){
        console.log('Cart page not found');
        $('#alert-message').show(500);
        return;
     }else{        
        console.log('cart found');
 	    chrome.scripting.executeScript({
            target: {tabId: tab.id},
            files: ['assets/js/getPagesSource.js']
        });
    }
  });     
}

function formatTylerList(productsList, filename){
  
    var filename = filename + '-tyler';
    // Remove the header
    productsList.shift()
    productsList.pop()

    var tylerList = '{"options":{"fileName":"'+filename+'"},"tableData":[{"sheetName":"Sheet1","data":[';
    tylerList += '[{"text":"line Number"},{"text":"Description"},{"text":"Part Number"},{"text":"Unit"},{"text":"Quantity"},{"text":"Unit Price"},{"text":"Tax"},{"text":"Freight"},{"text":"account code"},{"text":"Item number"},{"text":"grant project"}],';
    
    count = productsList.length;

    console.log(count);

    $.each(productsList, function(i, e) {
        
        var line = decodeURI(e).split('%2C');

        //%23%2CLink%2CTitle%2CSKU%2CQuantity%2CUnitPrice%2CPrice%0A');

        var line_no = i+1;
        
        var link = line[1];
        var title = line[2].replace(/['"]+/g, '');
        var sku = line[3];
        var quantity = line[4];
        var unitprice = line[5].replace('USD','');
        var price = line[6].replace('USD','');
        var comma = (count == (i+1))?'':',';

        tylerList += '[{"text":"'+line_no+'"},{"text":"'+title+'"},{"text":"'+sku+'"},{"text":""},{"text":"'+quantity+'"},{"text":"'+unitprice+'"},{"text":"0"},{"text":"0"},{"text":""},{"text":""},{"text":""}]' + comma;  
              
    });

    tylerList += ']}]}';

    return tylerList;

};

function scrapWBMasonMatchDetails(html) {
  
	var totalprice = 0;

    var productsList = new Array('%23%2CLink%2CTitle%2CSKU%2CQuantity%2CUnitPrice%2CPrice%0A');
    $(html).find('.cart-item-container').children('div.cart-item').each(function(key){ 
        currencycode = 'USD';
        currencycodeitem = '%20USD';
        title = $(this).find('div.item-desc a').text().replace(/,/g, " ").replace(/#/g, " no. ").replace(/ /g,"%20");;
        sku = $(this).find('p.item-uom span').text();
        unitprice = $(this).find('div.cart-col-price span.price').text().replace(/[^0-9.-]+/g,"");
        price = $(this).find('div.cart-col-total span.price').text().replace(/[^0-9.-]+/g,"");
        quantity = Math.round(Number(price.replace(/[^0-9.-]+/g,"")) / Number(unitprice.replace(/[^0-9.-]+/g,"")));
        link = '';

        if(unitprice != undefined){
      
            subtotalprice = parseFloat(unitprice) * parseInt(quantity)
         
            if (!price){
                price = parseFloat(unitprice) * parseInt(quantity)
            }           
       
            totalprice = parseFloat(totalprice) + parseFloat(subtotalprice) 
          
            totalprice = parseFloat(totalprice.toFixed(2))
          
        }

        console.log(key+'%2C'+link+'%2C'+title+'%2C'+sku+'%2C'+quantity+'%2C'+unitprice+currencycodeitem+'%2C'+price+currencycodeitem+'%0A');
       
        productsList.push(key+'%2C'+link+'%2C'+title+'%2C'+sku+'%2C'+quantity+'%2C'+unitprice+currencycodeitem+'%2C'+price+currencycodeitem+'%0A')

    });
  
    if(currencycode == 'USD')
    totalprice = totalprice + '%20USD';

    productsList.push('%2C'+''+'%2C'+''+'%2C'+''+'%2C'+'%2C'+'Total'+'%2C'+totalprice+'%0A')

    var tylerList = formatTylerList(productsList, 'wbmason');

    var imports = {bb: productsList, tyler: tylerList};

    //productsList.push('%2C'+''+'%2C'+''+'%2C'+''+'%2C'+'%2C'+'Total'+'%2C'+totalprice+'%0A')

    return imports;

}

function scrapHDMatchDetails(html) {
  
	var totalprice = 0;
    
    var productsList = new Array('%23%2CLink%2CTitle%2CSKU%2CQuantity%2CUnitPrice%2CPrice%0A');

    var x = 0;
    $(html).find('.cart-main-container').children('div.grid').children('div.col__12-12').children('div.cartItemDesktop').each(function(key){ 
        var list_item = new Array();

        currencycode = 'USD';
        currencycodeitem = '%20USD';
        title1 = $(this).find('h3.cartItem__brandName a span').eq(0).text().replace(/,/g, " ").replace(/#/g, " no. ").replace(/ /g,"%20");
        title2 = $(this).find('h3.cartItem__brandName a span').eq(1).text().replace(/,/g, " ").replace(/#/g, " no. ").replace(/ /g,"%20");
        title = title1 + ' ' + title2;
        list_item.push(title);

        sku = $(this).find('div.ffm--cartItem-productId span span').eq(0).text().replace(/Store SKU #/g, " ").replace(/ /g,"");  
        list_item.push(sku);

        price = $(this).find('div.total_price_font').text().replace(/[^0-9.-]+/g,"");
        quantity = $(this).find('input.cartItem__qtyInput').val();
        if (quantity > 1){
            unitprice = $(this).find('div.ffm--desktop_pod_price div').eq(1).text().replace(/[^0-9.-]+/g,"");
            console.log(unitprice);
        } else {
            unitprice = price;
        }
   
        link = 'https:' + $(this).find('h3.cartItem__brandName a').attr("href");

        if(unitprice != undefined){      
            subtotalprice = parseFloat(unitprice) * parseInt(quantity)         
            if (!price){
                price = parseFloat(unitprice) * parseInt(quantity)
            } 
            totalprice = parseFloat(totalprice) + parseFloat(subtotalprice)           
            totalprice = parseFloat(totalprice.toFixed(2))          
        }

    
       productsList.push(key+'%2C'+link+'%2C'+title+'%2C'+sku+'%2C'+quantity+'%2C'+unitprice+currencycodeitem+'%2C'+price+currencycodeitem+'%0A')
 
        x++;
        
    });
  
    if(currencycode == 'USD')
    totalprice = totalprice + '%20USD';
   
    var tylerList = formatTylerList(productsList, 'home-depot');
    var imports = {bb: productsList, tyler: tylerList};

    return imports;

}

function scrapSPMatchDetails(html) {
  
	var totalprice = 0;

    var productsList = new Array('%23%2CLink%2CTitle%2CSKU%2CQuantity%2CUnitPrice%2CPrice%0A');
    
    $(html).find('.item_container').children('div.row.item-row').each(function(key){ 
        currencycode = 'USD';
        currencycodeitem = '%20USD';
        title = $(this).find('div.product-title a').text().replace(/,/g, " ").replace(/#/g, " no. ").replace(/ /g,"%20");
  

        //title = $(this).find('div.item-desc a').text().replace(/,/g, " ").replace(/#/g, " no. ").replace(/ /g,"%20");;
        //sku = $(this).find('div.item-code input').text().replace(/Item #:/g, " ");
        sku = $(this).find('div.item-code input').val();

        //unitprice = $(this).find('div.cart-col-price span.price').text().replace(/[^0-9.-]+/g,"");
        unitprice = $(this).find('div.price div#offerPrice').text().replace(/[^0-9.-]+/g,"");

        price = $(this).find('div.item-total div.price').text().replace(/[^0-9.-]+/g,"");

        quantity = Math.round(Number(price.replace(/[^0-9.-]+/g,"")) / Number(unitprice.replace(/[^0-9.-]+/g,"")));      

        link = '';

        console.log('title: ' + title);
        console.log('sku: ' + sku);
        console.log('unitprice: ' + unitprice);       
        console.log('price: ' + price);        
        console.log('quantity: ' + quantity);
        if (!title){
            title = $(this).find('p.product-title').text().replace(/,/g, " ").replace(/#/g, " no. ").replace(/ /g,"%20");
        }
        if (!sku){
            sku = $(this).find('div.item-code').text().replace(/Item #: /g, "").replace(/Item #: /g, "").trim();
        }
        if (!unitprice){
            unitprice = $(this).find('span.price span#offerPrice').text().replace(/[^0-9.-]+/g,"");
        }
        if (!price){
            price = $(this).find('div.total span.price').text().replace(/[^0-9.-]+/g,"");
        }
        if (!quantity){
            quantity = Math.round(Number(price.replace(/[^0-9.-]+/g,"")) / Number(unitprice.replace(/[^0-9.-]+/g,"")));      
        }
        console.log('title: ' + title);
        console.log('sku: ' + sku);
        console.log('unitprice: ' + unitprice);       
        console.log('price: ' + price);        
        console.log('quantity: ' + quantity);
        link = '';

        if(unitprice != undefined){
      
            subtotalprice = parseFloat(unitprice) * parseInt(quantity)
         
            if (!price){
                price = parseFloat(unitprice) * parseInt(quantity)
            }           
       
            totalprice = parseFloat(totalprice) + parseFloat(subtotalprice) 
          
            totalprice = parseFloat(totalprice.toFixed(2))
          
        }

        productsList.push(key+'%2C'+link+'%2C'+title+'%2C'+sku+'%2C'+quantity+'%2C'+unitprice+currencycodeitem+'%2C'+price+currencycodeitem+'%0A')

    });
  
    if(currencycode == 'USD')
    totalprice = totalprice + '%20USD';

    var tylerList = formatTylerList(productsList, 'home-depot');
    var imports = {bb: productsList, tyler: tylerList};

    return imports;


}

function scrapAmazonMatchDetails(html) {
    count = $(html).find('#nav-cart-count').text();
	var totalprice = 0;
	count = parseInt(count);
    if (count) {
        var productsList = new Array('%23%2CLink%2CTitle%2CSKU%2CQuantity%2CUnitPrice%2CPrice%0A');
        $(html).find('#activeCartViewForm .sc-list-body').children('div').each(function(key){ 
            console.log($(this)[0].dataset);
            title = $(this).find('span.sc-product-title span.a-truncate-full').text().replace(/\s+/g, " ").replace(/,/g, " |").replace(/#/g,"%23").replace(/ /g, "%20")
            link = 'https://' + domain + '/' + $(this).find('a.sc-product-link').attr('href') 

            quantity = $(this)[0].dataset.quantity
            unitprice = $(this)[0].dataset.price
            price = parseFloat(unitprice) * parseInt(quantity)
		    sku	= $(this)[0].dataset.asin
			if(unitprice != undefined){
                subtotalprice = parseFloat(unitprice) * parseInt(quantity)
                if (!price){
                    price = parseFloat(unitprice) * parseInt(quantity)
                }           
                totalprice = parseFloat(totalprice) + parseFloat(subtotalprice) 
                totalprice = parseFloat(totalprice.toFixed(2))
		    }
		
			currency = $(this)[0].dataset.subtotal
	    	if(currency != undefined){
            currency = JSON.parse(currency)  
     	    currencycode = currency.subtotal.code
		    if(currencycode == 'USD')
		    currencycodeitem = '%20USD'
		    else
		    currencycodeitem = ''
			}
		
            unitprice ?
                productsList.push(key-1+'%2C'+link+'%2C'+title+'%2C'+sku+'%2C'+quantity+'%2C'+unitprice+currencycodeitem+'%2C'+price+currencycodeitem+'%0A')
            : null
        });
	  
        if(currencycode == 'USD')
		totalprice = totalprice + '%20USD';
		
		productsList.push('%2C'+''+'%2C'+''+'%2C'+''+'%2C'+'%2C'+'Total'+'%2C'+totalprice+'%0A')
		
        var tylerList = formatTylerList(productsList, 'amazon');
        var imports = {bb: productsList, tyler: tylerList};
        
        return imports;
    }else
		return 0;
}
window.onload = onWindowLoad;


$(".tyler-excel").click(function () {
    var data = $('.tyler-excel').attr('data');

    tylerScrapedData = $.parseJSON(data);    
             
    Jhxlsx.export(tylerScrapedData.tableData, tylerScrapedData.options);
});


