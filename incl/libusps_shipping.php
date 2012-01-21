<?php

/*
Adam Bratt
6/10/2008
*/

class usps_shipping{
	var $country = "USA";
	var $server;
    var $user = "408GALAX6071";
    var $service = "All"; //Requested Services
    var $services = Array('1', '3'); //Returned Services
    var $service_codes = Array(
						'0' => 'USPS First-Class',
						'1' => 'USPS Priority Mail', 
						'2' => 'USPS Express Mail PO to PO', //PO Box to PO Box
						'3' => 'USPS Express Mail', //PO to Address
						'4' => 'USPS Parcel Post',
						'5' => 'USPS Bound Printed Matter',
						'6' => 'USPS Media Mail',
						'7' => 'USPS Library',
						'12' => 'USPS First-Class Postcard Stamped',
						'13' => 'USPS Express Mail Flat-Rate Envelope',
						'16' => 'USPS Priority Mail Flat-Rate Envelope',
						'17' => 'USPS Priority Mail Flat-Rate Box' 
						);
    var $to_zip;
    var $from_zip = '45011';
    var $pounds = 2;
    var $ounces = 0; //Without this default we cause problems
    var $firstclass = "PARCEL"; //Can also be FLAT or LETTER
    var $container = "RECTANGULAR";
    var $size = "REGULAR";	
    var $handling = 0;
    
    function __construct($vars, $test = FALSE){
    	if(isset($vars['services'])) $this->services = $vars['services'];
    	if(isset($vars['country'])) $this->country = $vars['country'];
    	if(isset($vars['service'])) $this->service = $vars['service'];
    	if(isset($vars['to_zip'])){
			// Must be 5 digit zip (No extension)
       		if(strlen($vars['to_zip']) != 5) $vars['to_zip'] = substr($vars['to_zip'], 0, 5); 
        	$this->to_zip = $vars['to_zip'];
		}
		if(isset($vars['from_zip'])){
			// Must be 5 digit zip (No extension)
       		if(strlen($vars['from_zip']) != 5) $vars['from_zip'] = substr($vars['from_zip'], 0, 5); 
        	$this->from_zip = $vars['from_zip'];
		}
    	if(isset($vars['weight']) && $vars['weight'] > 0){
			$this->pounds = round($vars['weight']/16);
			//echo $vars['weight']."<br>".$this->pounds;
			$this->ounces = $vars['weight']%16;
		} 
		if(isset($vars['handling'])) $this->handling = $vars['handling'];
    	if(isset($vars['container'])) $this->container = $vars['container'];
    	if(isset($vars['size'])) $this->size = $vars['size'];
    	if($test == FALSE){
    		$this->server = "http://Production.ShippingAPIs.com/ShippingAPI.dll";
		}else{
			//Testing Sucks, Don't use it!
			$this->server = "http://testing.shippingapis.com/ShippingAPITest.dll";
		}
		if($this->pounds > 35 || ($this->pounds == 0 && $this->ounces < 6)){
			$this->machinable = 'FALSE';
		}else{
			$this->machinable = 'TRUE';
		}
		
	}
    
	
	function rate() {
        if($this->country=="USA"){
            $url = $this->server. "?API=RateV3&XML=";        
			$str =  '<RateV3Request USERID="'.$this->user.'">
						<Package ID="0">
							<Service>'.$this->service.'</Service>
							<FirstClassMailType>' . $this->firstclass . '</FirstClassMailType>
							<ZipOrigination>'. $this->from_zip .'</ZipOrigination>
							<ZipDestination>' . $this->to_zip . '</ZipDestination>
							<Pounds>' . $this->pounds . '</Pounds>
							<Ounces>' . $this->ounces . '</Ounces>
							<Container>' . $this->container . '</Container>
							<Size>' . $this->size . '</Size>
							<Machinable>' .$this->machinable . '</Machinable>
						</Package>
					</RateV3Request>
						';
            $url = $url.urlencode($str);
        }
        else {
            $str = $this->server. "?API=IntlRate&XML=<IntlRateRequest%20USERID=\"";
            $str .= $this->user . "\"><Package%20ID=\"0\">";
            $str .= "<Pounds>" . $this->pounds . "</Pounds><Ounces>" . $this->ounces . "</Ounces>";
            $str .= "<MailType>Package</MailType><Country>".urlencode($this->country)."</Country></Package></IntlRateRequest>";
        }
        
        $ch = curl_init();
        // set URL and other appropriate options
        curl_setopt($ch, CURLOPT_URL, $url);
        curl_setopt($ch, CURLOPT_HEADER, 0);
        curl_setopt($ch, CURLOPT_RETURNTRANSFER, 1);

        // grab URL and pass it to the browser
        $result = curl_exec($ch);
		//var_dump(htmlentities($result));

        // close curl resource, and free up system resources
        curl_close($ch);
        
        $xml_parser = new DOMDocument();
		$xml_parser->loadXML($result);
		$package = $xml_parser->getElementsByTagName('Package');
		$postage = $xml_parser->getElementsByTagName('Postage');
		$shipping = '';
		foreach($postage as $p){
			$service_code = $p->getAttribute("CLASSID");
			$rate = $p->getElementsByTagName("Rate")->item(0)->nodeValue;
			if(in_array($service_code, $this->services)){
				$shipping[$service_code]['id'] = $service_code;	
				$shipping[$service_code]['price'] = $rate+$this->handling;
				$shipping[$service_code]['type'] = $this->service_codes[$service_code];		
			}					
		}
		return $shipping;
    }
}
?>
