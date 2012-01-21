<?php

class authnet {

	private $field_string;
	private $fields = array();

	private $response_string;
	private $response = array();

	private $test_url = "https://test.authorize.net/gateway/transact.dll";
	private $production_url = "https://secure.authorize.net/gateway/transact.dll";
	private $gateway_url;

	public function __construct($login=null,$transkey=null) {

		// some default values

		$this->add_field('x_version', '3.1');
		$this->add_field('x_delim_data', 'TRUE');
		$this->add_field('x_delim_char', '|');  
		$this->add_field('x_url', 'FALSE');
		$this->add_field('x_type', 'AUTH_CAPTURE');
		$this->add_field('x_method', 'CC');
		$this->add_field('x_relay_response', 'FALSE');
		$config=config::get_class_config('authnet');
		foreach($config as $k=>$v) {
			if(substr($k,0,2)!='x_') continue;
			$this->add_field($k,$v);
		}

		if($login!==null) {
			$this->add_field('x_login',$login);
			$this->add_field('x_trans_key',$transkey);
		}

		if(!empty($config['testing'])) {
			$this->gateway_url=$this->test_url;
			$this->add_field('x_test_request', 'TRUE');
		}else{
			$this->gateway_url=$this->production_url;
		}
   }
   
	public function add_field($field, $value) {

		// adds a field/value pair to the list of fields which is going to be 
		// passed to authorize.net.  For example: "x_version=3.1" would be one
		// field/value pair.  A list of the required and optional fields to pass
		// to the authorize.net payment gateway are listed in the AIM document
		// available in PDF form from www.authorize.net

		$this->fields["$field"] = $value;   

	}

	public function process() {

		// This function actually processes the payment.  This function will 
		// load the $response array with all the returned information.  The return
		// values for the function are:
		// 1 - Approved
		// 2 - Declined
		// 3 - Error

		// construct the fields string to pass to authorize.net
		foreach( $this->fields as $key => $value ) 
		 $this->field_string .= "$key=" . urlencode( $value ) . "&";

		// execute the HTTPS post via CURL
		$ch = curl_init($this->gateway_url); 
		curl_setopt($ch, CURLOPT_HEADER, 0); 
		curl_setopt($ch, CURLOPT_RETURNTRANSFER, 1);
		curl_setopt($ch, CURLOPT_SSL_VERIFYPEER, FALSE);
		curl_setopt($ch, CURLOPT_POSTFIELDS, rtrim( $this->field_string, "& " )); 
		$this->response_string = urldecode(curl_exec($ch)); 

		if (curl_errno($ch)) {
		 $this->response['Response Reason Text'] = curl_error($ch);
		 return 3;
		}
		else curl_close ($ch);


		// load a temporary array with the values returned from authorize.net
		$temp_values = explode('|', $this->response_string);

		// load a temporary array with the keys corresponding to the values 
		// returned from authorize.net (taken from AIM documentation)
		$temp_keys= array ( 
		   "Response Code", "Response Subcode", "Response Reason Code", "Response Reason Text",
		   "Approval Code", "AVS Result Code", "Transaction ID", "Invoice Number", "Description",
		   "Amount", "Method", "Transaction Type", "Customer ID", "Cardholder First Name",
		   "Cardholder Last Name", "Company", "Billing Address", "City", "State",
		   "Zip", "Country", "Phone", "Fax", "Email", "Ship to First Name", "Ship to Last Name",
		   "Ship to Company", "Ship to Address", "Ship to City", "Ship to State",
		   "Ship to Zip", "Ship to Country", "Tax Amount", "Duty Amount", "Freight Amount",
		   "Tax Exempt Flag", "PO Number", "MD5 Hash", "Card Code (CVV2/CVC2/CID) Response Code",
		   "Cardholder Authentication Verification Value (CAVV) Response Code"
		);

		// add additional keys for reserved fields and merchant defined fields
		for ($i=0; $i<=27; $i++) {
		 array_push($temp_keys, 'Reserved Field '.$i);
		}
		$i=0;
		while (sizeof($temp_keys) < sizeof($temp_values)) {
		 array_push($temp_keys, 'Merchant Defined Field '.$i);
		 $i++;
		}

		// combine the keys and values arrays into the $response array.  This
		// can be done with the array_combine() function instead if you are using
		// php 5.
		for ($i=0; $i<sizeof($temp_values);$i++) {
		 $this->response["$temp_keys[$i]"] = $temp_values[$i];
		}
		// $this->dump_response();
		// Return the response code.

		$rtn=$this->response['Response Code'];
		if($rtn!=1) {
			throw new Exception($this->get_response_reason_text());
		}
		return $this->response['Response Code'];

	}

	public function get_response_reason_text() {
	  return $this->response['Response Reason Text'];
	}

	public function get_response_key($key) {
		return isset($this->response[$key]) ? $this->response[$key] : null;
	}

	public function dump_fields() {

	  // Used for debugging, this function will output all the field/value pairs
	  // that are currently defined in the instance of the class using the
	  // add_field() function.
	  
	  echo "<h3>authorizenet_class->dump_fields() Output:</h3>";
	  echo "<table width=\"95%\" border=\"1\" cellpadding=\"2\" cellspacing=\"0\">
			<tr>
			   <td bgcolor=\"black\"><b><font color=\"white\">Field Name</font></b></td>
			   <td bgcolor=\"black\"><b><font color=\"white\">Value</font></b></td>
			</tr>"; 
			
	  foreach ($this->fields as $key => $value) {
		 echo "<tr><td>$key</td><td>".urldecode($value)."&nbsp;</td></tr>";
	  }

	  echo "</table><br>"; 
	}

	public function dump_response() {

		// Used for debuggin, this function will output all the response field
		// names and the values returned for the payment submission.  This should
		// be called AFTER the process() function has been called to view details
		// about authorize.net's response.

		echo "<h3>authorizenet_class->dump_response() Output:</h3>";
		echo "<table width=\"95%\" border=\"1\" cellpadding=\"2\" cellspacing=\"0\">
			<tr>
			   <td bgcolor=\"black\"><b><font color=\"white\">Index&nbsp;</font></b></td>
			   <td bgcolor=\"black\"><b><font color=\"white\">Field Name</font></b></td>
			   <td bgcolor=\"black\"><b><font color=\"white\">Value</font></b></td>
			</tr>";
			
		$i = 0;
		foreach ($this->response as $key => $value) {
		 echo "<tr>
				  <td valign=\"top\" align=\"center\">$i</td>
				  <td valign=\"top\">$key</td>
				  <td valign=\"top\">$value&nbsp;</td>
			   </tr>";
		 $i++;
		} 
		echo "</table><br>";
	}    
}
?> 
