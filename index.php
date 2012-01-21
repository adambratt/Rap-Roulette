<?php
/**
 * Site loader 
 */


//if(count($_POST)) fixp($_POST); // Uncomment this on GoDaddy or HostGator servers

function fixp(&$in) {
	foreach($in as &$a) {
		if(is_array($a)) {
			fixp($a);
		}else{
			$a=stripslashes($a);
		}
	}
}

function exp_handler($e) {
	$tmp=new datarow(null,'error_log');
	$tmp->create(array('error'=>$e->getMessage(),'backtrace'=>$e->getTraceAsString(),'uid'=>auth::get_uid(),'ip'=>$_SERVER['REMOTE_ADDR']));
	echo '<h1>An internal error has occured</h1>';
}

set_exception_handler('exp_handler');

//session_start();
$ub=dirname($_SERVER['SCRIPT_NAME']);
if($ub=='.') $ub='/';
if(substr($ub,-1,1)!='/') $ub.='/';
define('UBASE',$ub);
define('CURADD',$_SERVER['HTTP_HOST'].UBASE);
require_once('incl/libconfig.php');

$c=config::get_instance();
$cfg=config::get_class_config('global');

date_default_timezone_set($cfg['default_time_zone']);

if(isset($cfg['modr']) && $cfg['modr']) define('MODR',true);

// Definitions
define('CWD',str_replace("\\","/",getcwd()));
define('SMARTY_DIR',CWD.'/incl/libs/');
define('IMGDIR',CWD.'/images/listingimgs/');
// Required files that would not be found by the autoloader
require_once(SMARTY_DIR.'/Smarty.class.php');

// Standard functions are now in incl/functions.php
require_once('incl/functions.php');

try{
	$db=PDOclass::get_instance();
}catch(Exception $e) {
	$smarty=smartyex::get_instance();
	$smarty->assign('error',$e->getMessage());
	$smarty->display('preinstall.html');
	exit;
}

stream_wrapper_register('db','dbfile');
if(empty($cfg['local_files'])) define('USEDB',1);

$s=new sessions();
$site=new site();

session_set_save_handler(array('sessions','open'),array('sessions','close'),array('sessions','read'),array('sessions','write'),array('sessions','destroy'),array('sessions','gc'));
session_start();

$site->display();
exit;
?>
