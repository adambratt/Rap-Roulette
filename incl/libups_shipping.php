<?php

/**
 * Adam Bratt 
 * 3 5 2008
 */
 

class ups_shipping {
	
	private static $instance;
	private $ups_user;
	private $ups_pass;
	private $access_key;
	private $activity;
	private $rate_url;
	private $service_codes = array('domestic' => array(
										'01' => 'UPS Next Day Air',
										'02' => 'UPS Second Day Air',
										'03' => 'UPS Ground',
										'12' => 'UPS Three-Day Select',
										'13' => 'UPS Next Day Air Saver',
										'14' => 'UPS Next Day Air early AM',
										'59' => 'UPS Second Day Air AM',
										'65' => 'UPS Saver'),
									'world' => array(
										'01' => 'UPS Next Day Air',
										'02' => 'UPS Second Day Air',
										'03' => 'UPS Ground',
										'07' => 'UPS Worldwide ExpressSM',
										'08' => 'UPS Worldwide ExpeditedSM',
										'11' => 'UPS Standard',
										'12' => 'UPS Three-Day Select',
										'13' => 'UPS Next Day Air Saver',
										'14' => 'UPS Next Day Air early AM',
										'54' => 'UPS Worldwide Express PlusSM',
										'59' => 'UPS Second Day Air AM',
										'65' => 'UPS Saver')
									);
	
	//Package Information
	private $defaults = Array( 'length' => '18', 'height' => '18', 'width' => '18', 'weight' => '2');
	private $to_zip;
	private $from_zip = 49506;
	private $shipping_type;

	public function __construct() {
		$this->access_key = 'EC20CA10D66BDEA4';
		$this->ups_user = 'adamjbratt';
		$this->ups_pass = 'adamjon900';
		$this->activity = 'activity';
		$this->shipping_type = 'domestic';
		
		$this->rate_url = 'https://onlinetools.ups.com/ups.app/xml/Rate';
		//$this->rate_url = 'https://wwwcie.ups.com/ups.app/xml/Rate'; //TESTING URL
	}

	public function rate($to_zip, $size, $services = '', $handling = 0, $from_zip = '', $shipping_type = '') {
		if(strlen($to_zip) < 5 )
			throw new exception("Invalid Zip Code!");
		if(strlen($from_zip) < 5 ){
			if(strlen($this->from_zip) < 5){
				throw new exception("Invalid Zip Code!");
			}else{
				$from_zip = $this->from_zip;	
			}
		}		
		if(!empty($shipping_type)) $this->shipping_type = $shipping_type;
		
		$this->length = (isset($size['length'])&& $size['length'] > 0) ? $size['length'] : $this->defaults['length'];
		$this->height = (isset($size['height'])&& $size['height'] > 0) ? $size['height'] : $this->defaults['height'];
		$this->width = (isset($size['width'])&& $size['width'] > 0) ? $size['width'] : $this->defaults['width'];
		$this->weight = (isset($size['weight'])&& $size['weight'] > 0) ? $size['weight'] : $this->defaults['weight'];
		$this->to_zip = $to_zip;	
		$this->from_zip = $from_zip;	
		
		if(!is_array($services)){
			$services = Array('03', '02', '12', '01');	
		}
		
		$service_codes = array();
		foreach($services as $s){
			$service_codes[$s] = $this->service_codes[$this->shipping_type][$s];
		}		
			
		$rates = $this->do_rate();
		while (list($var,$val) = each ($service_codes)) {
			if(isset($rates[$var])){
				$estimate[$var]['price'] = $rates[$var]+$handling;
  				$estimate[$var]['type'] = $val;
  				$estimate[$var]['id'] = $var;
			}	
  		}
  		
  		if(!isset($estimate) || !count($estimate))
  			throw new exception('An error occured while retrieving shipping information!');
  		
  		return $estimate;
	}

	public function do_rate(){
		$y = '
			<?xml version="1.0"?>
				<AccessRequest xml:lang="en-US">
				 	<AccessLicenseNumber>EC20CA10D66BDEA4</AccessLicenseNumber>
					<UserId>adamjbratt</UserId>
					<Password>adamjon900</Password>
				</AccessRequest>

			<?xml version="1.0"?>
				<RatingServiceSelectionRequest xml:lang="en-US">
					<Request>
						<RequestAction>Rate</RequestAction>
						<RequestOption>Shop</RequestOption>
						<TransactionReference>
							<CustomerContext>Bare Bones Rate Request</CustomerContext>
							<XpciVersion>1.0</XpciVersion>
						</TransactionReference>
					</Request>
					<PickupType>
						<Code>01</Code>
					</PickupType>
					<Shipment>
						<Shipper>
							<Address>
								<PostalCode>'.$this->from_zip.'</PostalCode>
								<CountryCode>US</CountryCode>
							</Address>
						</Shipper>
						<ShipTo>
							<Address>
								<PostalCode>'.$this->to_zip.'</PostalCode>
								<CountryCode>US</CountryCode>
							</Address>
						</ShipTo>
						<ShipFrom>
							<Address>
								<PostalCode>'.$this->from_zip.'</PostalCode>
								<CountryCode>US</CountryCode>
							</Address>
						</ShipFrom>
						<Package>
							<PackagingType>
								<Code>02</Code>
							</PackagingType>
							<Dimensions>
								<UnitOfMeasurement>
									<Code>IN</Code>
								</UnitOfMeasurement>
								<Length>'.$this->length.'</Length>
								<Width>'.$this->width.'</Width>
								<Height>'.$this->height.'</Height>
							</Dimensions>
							<PackageWeight>
								<UnitOfMeasurement>
									<Code>LBS</Code>
								</UnitOfMeasurement>
								<Weight>'.$this->weight.'</Weight>
							</PackageWeight>
						</Package>
					</Shipment>
				</RatingServiceSelectionRequest>';
				
				$ch = curl_init(); /// initialize a cURL session
				curl_setopt ($ch, CURLOPT_URL,$this->rate_url);
				curl_setopt ($ch, CURLOPT_HEADER, 0);
				curl_setopt($ch, CURLOPT_POST, 1);
				curl_setopt($ch, CURLOPT_POSTFIELDS, $y);
				curl_setopt ($ch, CURLOPT_RETURNTRANSFER, 1);
				curl_setopt($ch, CURLOPT_SSL_VERIFYPEER, false);
				curl_setopt($ch, CURLOPT_SSL_VERIFYHOST, 2);
				$result = curl_exec ($ch)or die("EXECUTE_ERROR#".curl_errno($ch).": ".curl_error($ch)."<br>".$this->rate_url); 
				$xml_parser = new DOMDocument();
				$xml_parser->loadXML($result);
				$shipment = $xml_parser->getElementsByTagName('RatedShipment');
				$shipping = '';
				foreach($shipment as $s){
					$charges = $s->getElementsByTagName('TotalCharges')->item(0);
					$cost = $charges->getElementsByTagName('MonetaryValue')->item(0)->nodeValue;
					$service = $s->getElementsByTagName('Service')->item(0);
					$service_code = $service->getElementsByTagName('Code')->item(0)->nodeValue;
					$shipping[$service_code] = $cost;					
				}
				return $shipping;
				/*
				
				$ch	=	new curlSubmit("post_ssl",$this->url,$y);
				$ch->execute();*/
				//echo "$y<br /><br />$ch->result";
	}
	
	public function shipping_type($id, $type = ''){
		if(empty($type)) $type = $this->shipping_type;
		return $this->service_codes[$type][$id];
	}
	
	public function set_account($key,$user,$pass) {
		$this->access_key = $key;
		$this->ups_user = $user;
		$this->ups_pass = $pass;
	}
}
?>