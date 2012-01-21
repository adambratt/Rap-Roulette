<?php

function __autoload($class) {
	if(is_dir(CWD.'/incl/addons/'.$class)) {
		if(is_file(CWD.'/incl/addons/'.$class.'/lib'.$class.'.php')) {
			include_once(CWD.'/incl/addons'.$class.'/lib'.$class.'.php');
			return;
		}
		if(is_file(CWD.'/incl/addons/'.$class.'/'.$class.'.php')) {
			include_once(CWD.'/incl/addons/'.$class.'/'.$class.'.php');
			return;
		}
	}

	if(is_file(CWD.'/incl/lib'.$class.'.php')) {
		// incl/lib__CLASSNAME__.php
		include_once(CWD.'/incl/lib'.$class.'.php');
		return;
	}

	if(is_dir(CWD.'/modules/'.$class) && is_file('modules/'.$class.'/'.$class.'.php')) {
		// modules/__CLASSNAME__/__CLASSNAME__.php
		include_once(CWD.'/modules/'.$class.'/'.$class.'.php');
		return;
	}

	if(substr($class,0,3)=='mod') {
		$tmp=substr($class,3);
		if(is_dir(CWD.'/modules/'.$tmp) && is_file('modules/'.$tmp.'/'.$class.'.php')) {
			include_once(CWD.'/modules/'.$tmp.'/'.$class.'.php');
			return;
		}
	}
	
	$stp=strpos($class,'_');
	if($stp!==false) {
		$mod=substr($class,0,$stp);
		if(is_dir(CWD.'/modules/'.$mod) && is_file('modules/'.$mod.'/'.$class.'.php')) {
			include_once(CWD.'/modules/'.$mod.'/'.$class.'.php');
			return;
		}
	}
}

function aurl($mod=null, $method=null, $args=null, $rel=false, $rewrite = true){
	if(is_array($args)) $args=implode('/',$args);
	if(!empty($args)) $method = $method.'/'.$args;
	return url('admin',$mod,$method,$rel,$rewrite);
}

function url($mod=null,$method=null,$args=null,$rel=false, $rewrite = true) {
	if($rel) {
		$out=UBASE;
	}else{
		$out=$_SERVER['HTTP_HOST'].UBASE;
	}
	if($mod===null) return $out;

	if(is_array($args)) $args=implode('/',$args);

	if(defined('MODR') && MODR && $rewrite) {
		if($mod=='cms' && $method=='view') {
			$clib=new cms_lib();
			//$clib->update_link($args);
			if(modules::mod_exists($args)) {
				$out.="cms/view/$args";
			}else{
				$out.="$args";
			}
			if(substr($out,-1) !='/') $out.='/';
		}else{
			$out.="$mod/";
			if($method !== null)
				$out .= "$method/";
			
			if($args!==null) {
				$out.=$args;
			}
		}
		return $out;
	}else{
		$out.="?module=$mod&modmethod=$method";
		if($args!==null) {
			$out.="&args=$args";
		}
		return $out;
	}
}

function debug($string,$dump=false) {
	$smarty=smartyex::get_instance();
	if(!isset($debug_loaded)) {
		static $debug_loaded=true;
		$styles="#debug {position: absolute; border: thin solid black; background-color: white; width: 500px; top: 10px; left: 10px;}\n";
		$styles.="#debug_close {float: right; width: 20px;}\n";
		$smarty->append('custom_styles',$styles);
	}
	if($dump || !is_string($string)) {
		$string='<pre>'.var_export($string,true).'</pre>';
	}
	$smarty->append('debugdata',$string);
}

function redirect($url) {
	header('Location: http://'.$url);
	exit;
}

//
//Misc Functions
//

function ajax_output($msg='',$status=1){
    $json=array();
    if(strlen($msg) && $status === 0){
        $json['error']=$msg;
    }elseif(strlen($msg)){
        $json['msg']=$msg;
    }
    $json['status']=$status;
    die(json_encode($json));
}


function states() {
return array(	"AL"=>"Alabama",
							"AK"=>"Alaska",
							"AZ"=>"Arizona",
							"AR"=>"Arkansas",
							"CA"=>"California",
							"CO"=>"Colorado",
							"CT"=>"Connecticut",
							"DE"=>"Delaware",
							"DC"=>"Dist of Columbia",
							"FL"=>"Florida",
							"GA"=>"Georgia",
							"HI"=>"Hawaii",
							"ID"=>"Idaho",
							"IL"=>"Illinois",
							"IN"=>"Indiana",
							"IA"=>"Iowa",
							"KS"=>"Kansas",
							"KY"=>"Kentucky",
							"LA"=>"Louisiana",
							"ME"=>"Maine",
							"MD"=>"Maryland",
							"MA"=>"Massachusetts",
							"MI"=>"Michigan",
							"MN"=>"Minnesota",
							"MS"=>"Mississippi",
							"MO"=>"Missouri",
							"MT"=>"Montana",
							"NE"=>"Nebraska",
							"NV"=>"Nevada",
							"NH"=>"New Hampshire",
							"NJ"=>"New Jersey",
							"NM"=>"New Mexico",
							"NY"=>"New York",
							"NC"=>"North Carolina",
							"ND"=>"North Dakota",
							"OH"=>"Ohio",
							"OK"=>"Oklahoma",
							"OR"=>"Oregon",
							"PA"=>"Pennsylvania",
							"RI"=>"Rhode Island",
							"SC"=>"South Carolina",
							"SD"=>"South Dakota",
							"TN"=>"Tennessee",
							"TX"=>"Texas",
							"UT"=>"Utah",
							"VT"=>"Vermont",
							"VA"=>"Virginia",
							"WA"=>"Washington",
							"WV"=>"West Virginia",
							"WI"=>"Wisconsin",
							"WY"=>"Wyoming");
}

//Formats a price to two decimal points
function price($price){
	if(is_array($price)) list($price) = array_values($price);
	$price = str_replace(",","",$price);
	return number_format($price, 2, '.', '');
}

//Used for store...
function get_price_type($params){
	$price_type = $params['type'];
	$price = $params['price'];
	if($price == 0) return;
	switch($price_type){
			default:  $final = '(+ $'.price($price).')'; break;
			case '$': $final = '($'.price($price).')'; break;
			case '+': $final = '(+ $'.price($price).')'; break;
			case '-': $final = '(- $'.price($price).')'; break;
			case '%': $final = '(+ '.$price.'%)'; break;
			case '^': $final = '(- '.$price.'%)'; break;
		}
	return $final;
}
// End Smarty Functions

?>
