<?php

class config {

	private $config_values=Array();
	static private $instance;
	public $loaded=false;
	static public $loadable=false;

	private function __construct() {
		$this->load_ini();
		if($this->get_key('global','debug')) $this->set_debug();
	}

	public function __get($group) {
		// Return an entire group of config values.
		// Usage: $config->groupname;
		return $this->get_key($group);
	}

	static public function get_instance() {
		return isset(self::$instance) ? self::$instance : self::$instance=new self();
	}

	public function set_key($group, $key, $value) {
		if(!isset($this->config_values[$group]) || !is_array($this->config_values[$group])) $this->config_values[$group]=array();
		$this->config_values[$group][$key]=$value;
	}

	public static function key($group,$key=NULL) {
		$cfg=config::get_instance();
		if($key===null) return $cfg->get_class_config($group);
		return $cfg->get_key($group,$key);
	}

	public function get_key($group,$key=NULL) {
		if($key==NULL) return $this->get_class_config($group);
		return isset($this->config_values[$group][$key]) ? $this->config_values[$group][$key] : NULL;
	}

	public function set_debug($debugging=true) {
		if($debugging) {
			error_reporting(E_ALL|E_STRICT);
			ini_set('display_errors','1');
		}else{
			ini_set('display_errors','0');
		}
	}

	static public function get_class_config($classname) {
		$cfg=self::get_instance();
		return isset($cfg->config_values[$classname]) ? $cfg->config_values[$classname] : Array();
	}

	private function load_ini() {
		// This function loads file based default config settings.
		// These settings should be site wide
		// 
		// This method now merges the custom settings with the default settings.
		// Custom settings will overwrite default settings
		$custom_ini_file='.htconfig_custom.ini'; // .ht files are automatically protected by Apache
		$default_ini_file='.htconfig.ini';
		$in=array();
		$out=array();

		if(file_exists($default_ini_file)) {
			$in=parse_ini_file($default_ini_file,true);
		}

		$out=$in;

		if(file_exists($custom_ini_file)) {
			$tmp=parse_ini_file($custom_ini_file,true);
			if(!is_array($tmp)) $tmp=array();
			foreach($tmp as $k=>$v) {
				$tempvalue=$v;
				if(!is_array($tempvalue)) $tempvalue=array();
				if(isset($in[$k]) && is_array($in[$k])) {
					$out[$k]=array_merge($in[$k],$tempvalue);
				}else{
					$out[$k]=$tempvalue;
				}
			}
		}

		$this->config_values=$out;
	}

	public function load_db() {
		if($this->loaded) return;
		$db=PDOclass::get_config_instance();
		$in=$db->query_all('SELECT * FROM `config_values` ORDER BY `class`');
		if(!is_array($in) || !count($in)) $in=array();
		$classes=$this->get_classes();
		foreach($in as $a) {
			if(in_array($a['class'],$classes)) unset($classes[array_search($a['class'],$classes)]);
			if($a['value']===NULL || $a['value']==='') continue;
			if($this->get_key($a['class'],'no_overwrite')) continue;
			$this->set_key($a['class'],$a['key'],$a['value']);
		}

		// Auto import from the ini file
		// Usage: add auto_import = 1 to the config section you want imported

		if(count($classes)) {
			foreach($classes as $a) {
				if($this->get_key($a,'auto_import')) {
					foreach($this->get_class_config($a) as $k=>$v) {
						if($k=='auto_import') continue;
						if(substr($k,0,5)=='type_') continue;
						$type=$this->get_key($a,'type_'.$k);
						if($type===null) $type='text';
						$db->insert_array('config_values',array('class'=>$a,'key'=>$k,'value'=>$v,'type'=>$type));
					}
				}
			}
		}

		$this->loaded=true;
	}

	static public function db_loadable() {
		self::$loadable=true;
	}

	static public function loadable() {
	}

	private function get_classes() {
		return array_keys($this->config_values);
	}
}
?>
