<?php

//Paypal Payment Class
//6/20/2008
//Adam Bratt

class paypal {
	

	var $version = '51.0';
	var $url = 'https://api-3t.paypal.com/nvp';
	var $test_url = 'https://api-3t.sandbox.paypal.com/nvp';
	var $beta_url = 'https://api-3t.beta-sandbox.paypal.com/nvp';
	var $test_url_checkout = 'https://www.sandbox.paypal.com/webscr&cmd=_express-checkout&token=';
	var $beta_url_checkout = 'https://www.beta-sandbox.paypal.com/webscr&cmd=_express-checkout&token=';
	var $url_checkout = 'https://www.paypal.com/webscr&cmd=_express-checkout&token=';
	var $field = array();
	var $debug = false; //Set to true to var_dump stuff
	var $test = true; //Not the same as debug. Paypal's testing environment/sandbox
	var $beta = false; //Beta allows testing of some features that don't work in normal sandbox or if normal sandbox is down
	
	public function __construct($username=null,$password=null,$signature=null){
		$this->field =& $_SESSION['paypal'];
		$this->add_field('PAYMENTACTION', 'Sale'); //Optional -- Either Sale, Authorization, or Order (sale is default) 
		$this->add_field('CURRENCYCODE', 'USD'); //Optional -- USD is default anyways
		$config = config::get_class_config('paypal');
		foreach($config as $k=>$v){
			$this->$k = $v;
		}

		if($username!==null) {
			$this->username=$username;
			$this->password=$password;
			$this->signature=$signature;
			$this->test=false;
		}
		if($this->test){
			$this->url = $this->test_url;
			$this->url_checkout = $this->test_url_checkout;	
		} 
		if($this->beta){
			$this->url = $this->beta_url;
			$this->url_checkout = $this->beta_url_checkout;	
		} 
	}
	
	public function add_field($name, $value){
		$this->field[$name] = $value;
	}
	
	public function get_field($name){
		return $this->field[$name];
	}
	
	public function destroy(){
		$this->field = array();
		if($this->debug) echo "Destroying Session...<br><br>";
	}
	
	//Required security header for most API requests
	public function security_vars(){
		return "VERSION=".urlencode($this->version)."&PWD=".urlencode($this->password)."&USER=".urlencode($this->username)."&SIGNATURE=".urlencode($this->signature);
	}
	
	///////////////////////////////////////////////////////////////
	/*	                    DIRECT PAYMENT  					*/
	/////////////////////////////////////////////////////////////
	/*
		1. Call direct_payment() to charge or authorize card for later charge
		-----------------------------------
		Recurring Billing
		-----------------------------------
		1. Call create_billing() with all the needed information
	*/
	
	/*///////////////////////////////////////////////---- direct_payment()
	/// Charge a credit card or authorizes card for later charge
	/// Requires the following fields:
	/// 	PAYMENTACTION ~ Either Authorization or Sale
	/// 	IPADDRESS ~ IP of the payer's browser. Used for fraud detection
	///		AMT ~ Amount of transaction, requires 2 decimals
	///		CREDITCARDTYPE ~ Either Visa, Mastercard, Discover, or Amex
	///		ACCT ~ Credit Card Number
	///		EXPDATE ~ Credit Card Expiration Date in MMYYYY format, includes leading zero
	/// The following are optional:
	///		NOTIFYURL ~ Used for IPN
	///		CVV2 ~ May be required. 3 digits or 4 for Amex
	///		FIRSTNAME ~ Cardholder's first name
	/// 	LASTNAME ~ Cardholder's last name
	///		EMAIL ~ Payer's Email
	/// Returns the following:
	///		AMT ~ The credit card amount
	///		TRANSACTIONID ~ Transaction number
	///		AVSCODE ~ Returned if using Address Verification
	/*/
	public function direct_payment(){
		$this->add_field('METHOD', 'DoDirectPayment');  //Required
		$accepted_vars = Array('PAYMENTACTION', 'IPADDRESS', 'AMT', 'DESC', 'BILLINGFREQUENCY', 'CURRENCYCODE', 'AMT', 'CREDITCARDTYPE', 'ACCT', 'EXPDATE', 'FIRSTNAME', 'LASTNAME', 'CVV2', 'EMAIL', 'METHOD', 'STREET', 'CITY', 'STATE', 'ZIP', 'COUNTRYCODE', 'FIRSTNAME', 'LASTNAME');
		if(!isset($this->field['AMT']))	throw new exception('Missing Required Input!');
		if($this->debug) echo "Starting	direct_payment....<br /><br />";
		$vars = $this->security_vars();
		foreach($this->field as $k=>$v){
			if(!in_array($k, $accepted_vars)) continue;
			$vars .= "&".$k."=".urlencode($v);
		}
		$response = $this->do_url($this->url, $vars);
		if($response['ACK'] != 'Success'){
			throw new exception('Error #'.$response['L_ERRORCODE0'].": ".$response['L_LONGMESSAGE0']);
		}
		return $response;		
	}

	
	///////////////////////////////////////////////////////////////
	/*	                    EXPRESS CHECKOUT					*/
	/////////////////////////////////////////////////////////////
	/*
		1. Call set_checkout() to initialize the process and get token
		2. Call go_checkout() to redirect to paypal
		3. Call get_checkout() after callback to get user/address details from Paypal 
		4. Call do_checkout() to finalize the payment
		-----------------------------------
		Recurring Billing
		-----------------------------------
		3.5 Call create_billing() to finalize the recurring billing profile
	*/
	
	/*///////////////////////////////////////////////---- set_checkout()
	/// Gets Auth Token from Paypal for Express Checkout
	/// Requires the following fields:
	/// 	RETURNURL ~ URL to return to once payment is processed
	/// 	CANCELURL ~ URL to which customer is returned if process is canceled
	///		AMT ~ Amount of transaction, requires 2 decimals
	/// The following are optional:
	///		CURRENCYCODE ~ Three character currency code
	///		MAXAMT ~ The expected maximum total. Must not exceed $10,000
	///		EMAIL ~ Email address of the buyer. Used to pre-fill Paypal fields.
	///		DESC ~ Description of items the customer is purchasing (limit 127 chars)
	///		CUSTOM ~ Returned by paypal after checkout completes
	///		REQCONFIRMSHIPPING ~ Bit value for whether buyer is required to have a confirmed address
	///		NOSHIPPING ~ Bit value to hide all shipping address fields
	///		ADDROVERRIDE ~ Use provided address instead of the one on record for Paypal
	///		PAGESTYLE ~ Name of customized page style
	///		HDRIMG ~ URL of image/logo for payment page 750x90 MAX
	/// The following are required for billing agreements:
	///		L_BILLINGTYPEn ~ Type of Billing Agreement. Use RecurringPayments for recurring. n is 0-9
	///		L_BILLINGAGREEMENTDESCRIPTIONn ~ Title/Description of services associated with agreement. n is 0-9
	/// See Docs for other fields if needed including address, 10 custom fields, etc.
	/*/
	public function set_checkout(){
		$this->add_field('METHOD', 'SetExpressCheckout'); //Required
		if(empty($this->field['AMT']) || empty($this->field['CANCELURL']) || empty($this->field['RETURNURL']))
			throw new exception('Missing Required Input!');
		if($this->debug) echo "Starting set_checkout....<br /><br />";
		$vars = $this->security_vars();
		foreach($this->field as $k=>$v){
			$vars .= "&".$k."=".urlencode($v);
		}
		$response = $this->do_url($this->url, $vars);
		if($response['ACK'] != 'Success'){
			throw new exception('Error #'.$response['L_ERRORCODE0'].": ".$response['L_LONGMESSAGE0']);
		}
		$this->add_field('TOKEN', $response['TOKEN']); 
	}
	
	/*///////////////////////////////////////////////---- go_checkout()
	/// Pretty simple function, just heads to Paypal for checkout
	/// Requires the following fields:
	/// 	TOKEN ~ The token returned by set_checkout()
	/*/                                             
	public function go_checkout(){
		header("Location: ".$this->url_checkout.$this->field['TOKEN']);
		exit;		
	}
	
	/*///////////////////////////////////////////////---- get_checkout()
	/// Function for getting user/transaction information from Paypal
	/// Requires the following fields:
	/// 	TOKEN ~ The token returned by set_checkout()
	///	Returns the following fields:
	///		EMAIL
	///		PAYERSTATUS - Verified or unverified
	///		PAYERID - REQUIRED!!! for do_checkout()
	///		Addressinfo - See docs as theres a lot
	///		INVNUM - As defined in set_checkout
	///		CUSTOM - Custom field defined in set_checkout
	/*/
	public function get_checkout() {
		if(!isset($this->field['TOKEN'])) throw new Exception('General Error: Payment has not been sent to Paypal');
		$this->add_field('METHOD', 'GetExpressCheckoutDetails');                                               
		if($this->debug) echo "Starting	get_checkout....<br /><br />";
		$vars = $this->security_vars()."&METHOD=".urlencode($this->field['METHOD'])."&TOKEN=".urlencode($this->field['TOKEN']);
		$response = $this->do_url($this->url, $vars);
		if($response['ACK'] != 'Success'){
			throw new exception('Error #'.$response['L_ERRORCODE0'].": ".$response['L_LONGMESSAGE0']);
		}
		$this->add_field('PAYERID', $response['PAYERID']);
		return $response;		
	}
	
	/*///////////////////////////////////////////////---- do_checkout()
	/// Finalize the payment
	/// Requires the following fields:
	/// 	TOKEN ~ The token returned by set_checkout()
	///		PAYERID ~ From get_checkout()
	///		AMT	~ The amount of the transaction
	///		PAYMENTACTION ~ Set in construct
	///	Supports the following fields:
	///		CUSTOM
	///		INVNUM
	///		DESC
	///		List of items - See docs
	///	Returns the following fields:
	///		PAYMENTSTATUS 
	///		AMT
	///		EXCHANGERATE ~ Currency converted if needed
	///		FEEAMT ~ Paypal fee
	/*/
	public function do_checkout(){
		$this->add_field('METHOD', 'DoExpressCheckoutPayment');
		if(!isset($this->field['AMT'], $this->field['PAYERID']))
			throw new exception('Missing Required Input!');                                                                                                                                     
		if($this->debug) echo "Starting	do_checkout....<br /><br />";
		$vars = $this->security_vars()."&METHOD=".urlencode($this->field['METHOD'])."&TOKEN=".urlencode($this->field['TOKEN'])."&PAYERID=".urlencode($this->field['PAYERID'])."&AMT=".urlencode($this->field['AMT'])."&PAYMENTACTION=".urlencode($this->field['PAYMENTACTION']);
		$response = $this->do_url($this->url, $vars);
		if($response['ACK'] != 'Success'){
			throw new exception('Error #'.$response['L_ERRORCODE0'].": ".$response['L_LONGMESSAGE0']);
		}
		return $response;		
	}
	
	/*///////////////////////////////////////////////---- create_billing()
	/// Create a billing agreement
	/// Requires the following fields as a minimum:
	/// 	TOKEN ~ The token returned by set_checkout(), not required for direct payment
	///		PROFILESTARTDATE ~ The date when billing for this profile begins in UTC/GMT format
	///		BILLINGPERIOD ~ Day, Week, SemiMonth, Month, Year
	///		BILLINGFREQUENCY ~ Number of billing periods that make up a cycle. Max total 1 year
	///		DESC ~ Description of recurring payment
	///		AMT ~ Total billing amount for each billing cycle
	/// If using as direct payment, it also needs the following:
	///		CREDITCARDTYPE ~ Either Visa, Mastercard, Discover, or Amex
	///		ACCT ~ Credit Card Number
	///		EXPDATE ~ Credit Card Expiration Date in MMYYYY format, includes leading zero
	///		IPADDRESS ~ IP Address of buyer used in fraud detection
	///	Supports the following fields:
	///		SUBSCRIBERNAME
	///		Trial ~ See docs
	///	Returns the following fields:
	///		STATUS ~ Either ActiveProfile or PendingProfile
	///		PROFILEID ~ Used for future billing requests 
	/*/
	public function create_billing(){
		$accepted_vars = Array('TOKEN', 'PROFILESTARTDATE', 'BILLINGPERIOD', 'DESC', 'BILLINGFREQUENCY', 'CURRENCYCODE', 'AMT', 'CREDITCARDTYPE', 'ACCT', 'EXPDATE', 'FIRSTNAME', 'LASTNAME', 'SUBSCRIBERNAME', 'CVV2', 'METHOD', 'IPADDRESS', 'EMAIL');
		$this->add_field('METHOD', 'CreateRecurringPaymentsProfile');
		if(!isset($this->field['AMT'], $this->field['PROFILESTARTDATE'], $this->field['BILLINGPERIOD'], $this->field['BILLINGFREQUENCY']))
			throw new exception('Missing Required Input!');
		if($this->debug) echo "Starting	create_billing....<br /><br />";
		$vars = $this->security_vars();
		foreach($this->field as $k=>$v){
			if($k == 'TOKEN' && isset($this->field['ACCT'])) continue; //Skip token if recurring billing
			if(!in_array($k, $accepted_vars)) continue;
			$vars .= "&".$k."=".urlencode($v);
		}
		/* Old Way...no direct payments
		$vars = $this->security_vars()."&METHOD=".urlencode($this->field['METHOD'])."&TOKEN=".urlencode($this->field['TOKEN'])."&PROFILESTARTDATE=".urlencode($this->field['PROFILESTARTDATE'])."&AMT=".urlencode($this->field['AMT'])."&BILLINGFREQUENCY=".urlencode($this->field['BILLINGFREQUENCY'])."&BILLINGPERIOD=".urlencode($this->field['BILLINGPERIOD'])."&DESC=".urlencode($this->field['L_BILLINGAGREEMENTDESCRIPTION0']);
		*/
		$response = $this->do_url($this->url, $vars);
		if($response['ACK'] != 'Success'){
			throw new exception('Error #'.$response['L_ERRORCODE0'].": ".$response['L_LONGMESSAGE0']);
		}
		$this->add_field('PROFILEID', $response['PROFILEID']);
		return $response;		
	}
	
	/*///////////////////////////////////////////////---- get_billing()
	/// Gets a billing agreement
	/// Requires the following field:
	/// 	PROFILEID ~ Payments Profile ID
	///	Returns the following fields:
	///		STATUS ~ Status of the recurring profile: ActiveProfile, PendingProfile, CancelledProfile, SuspendedProfile or ExpiredProfile
	///		SUBSCRIBERNAME
	///		PROFILESTARTDATE
	/// 	See API for others
	/*/
	public function get_billing(){
		$this->add_field('METHOD', 'GetRecurringPaymentsProfileDetails');
		if(!isset($this->field['PROFILEID']) || empty($this->field['PROFILEID'])) throw new exception('Missing Required Input!');
		if($this->debug) echo "Getting billing information...<br /><br />";
		$vars = $this->security_vars()."&METHOD=".urlencode($this->field['METHOD'])."&PROFILEID=".urlencode($this->field['PROFILEID']);
		$response = $this->do_url($this->url, $vars);
		if($response['ACK'] != 'Success'){
			throw new exception('Error #'.$response['L_ERRORCODE0'].": ".$response['L_LONGMESSAGE0']);
		}
		return $response;
	}
	
	/*///////////////////////////////////////////////---- update_billing()
	/// Updates a billing agreements status
	/// Requires the following field:
	/// 	PROFILEID ~ Payments Profile ID
	///		ACTION ~ Cancel, Suspend, or Reactivate (Cancel is for active or suspended, Suspend is for active, and Reactivate is for Suspended)
	/// The following fields are optional:
	///		NOTE ~ Reason for change in the status. Sent to buyer's email if Profile created with ExpressCheckout Token
	///	Returns the following fields:
	///		PROFILEID ~ Payment Profile ID
	/*/
	public function update_billing(){
		$this->add_field('METHOD', 'GetRecurringPaymentsProfileDetails');
		if(!isset($this->field['PROFILEID']) || empty($this->field['PROFILEID'])) throw new exception('Missing Required Input!');
		if($this->debug) echo "Getting billing information...<br /><br />";
		$vars = $this->security_vars()."&METHOD=".urlencode($this->field['METHOD'])."&PROFILEID=".urlencode($this->field['PROFILEID'])."&ACTION=".urlencode($this->field['ACTION']);
		$response = $this->do_url($this->url, $vars);
		if($response['ACK'] != 'Success'){
			throw new exception('Error #'.$response['L_ERRORCODE0'].": ".$response['L_LONGMESSAGE0']);
		}
		return $response;
	}
	
	//Uses CURL on Paypal
	private function do_url($url, $vars){
		//Setting the curl parameters.
		$ch = curl_init($url);
		curl_setopt($ch, CURLOPT_VERBOSE, 1);
		curl_setopt($ch, CURLOPT_RETURNTRANSFER,1);
		curl_setopt($ch, CURLOPT_POST, 1);
	
		//turning off the server and peer verification(TrustManager Concept).
		curl_setopt($ch, CURLOPT_SSL_VERIFYPEER, FALSE);
		curl_setopt($ch, CURLOPT_SSL_VERIFYHOST, FALSE);

	
		//setting the vars as POST FIELD to curl
		if($this->debug) echo "Calling URL with: ".$vars."<br /><br />";
		curl_setopt($ch, CURLOPT_POSTFIELDS, $vars);
	
		//getting response from server
		$response = curl_exec($ch);
		if($this->debug) echo "Server Response....".$response."<br /><br />";
		$response_array = $this->deformat_response($response);
	
		if(curl_errno($ch)){
			$error['num'] = curl_errno($ch) ;
			$error['msg'] = curl_error($ch);
			throw new exception('Error '.$error['num'].': '.$error['msg']);
		}else{
			curl_close($ch);
		}
		return $response_array;
	}
	
	private function deformat_response($response)
	{
		$intial = 0;
	 	$final_array = array();
		while(strlen($response)){
			//postion of Key
			$keypos = strpos($response,'=');
			//position of value
			$valuepos = strpos($response,'&') ? strpos($response,'&'): strlen($response);
			/*getting the Key and Value values and storing in a Associative Array*/
			$keyval = substr($response,$intial,$keypos);
			$valval = substr($response,$keypos+1,$valuepos-$keypos-1);
			//decoding the respose
			$final_array[urldecode($keyval)] = urldecode( $valval);
			$response = substr($response,$valuepos+1,strlen($response));
	    }
		return $final_array;
	}

	
	
}

?>
