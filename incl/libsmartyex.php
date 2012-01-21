<?php

include_once('smartyfunctions.php');

/* * * * * * * * 
 * Static wrapper class for Smarty
 * * * * * * * */

class smartyex extends Smarty {

	static private $instance;
	private $cur_templ='index.html';
	private $template_set='default';
	public $template_rel_dir;
	private $styles;

	public function __construct() {
		$this->template_rel_dir = UBASE.'smarty/templates/'.$this->template_set.'/';
		$this->template_dir = CWD.'/smarty/templates/'.$this->template_set.'/';
		$this->compile_dir  = CWD.'/smarty/templates_c/'.$this->template_set.'/';
		$this->config_dir   = CWD.'/smarty/configs/';
		$this->cache_dir    = CWD.'/smarty/cache/';
		$this->set_template('index.html');

		if(!is_dir($this->compile_dir)) mkdir($this->compile_dir);
		
		$this->assign('ubase',UBASE);
		$this->assign('host',$_SERVER['SERVER_NAME']);
		
		$this->assign('stylesheet',$this->template_rel_dir.'styles.css');
		parent::__construct();
		$this->register_resource('mod', array("mod_get_template",
		                                        "mod_get_timestamp",
				                                "mod_get_secure",
						                        "mod_get_trusted"));
		$this->register_resource('db', array("db_get_template",
		                                        "db_get_timestamp",
				                                "db_get_secure",
						                        "db_get_trusted"));
		$this->auto_register();
		$this->database_register();
		$this->register_block('cms_block','block_cms');
		$this->assign('jpg_dir',$this->get_jpg_dir());
		$this->assign('icon_dir', $this->get_icon_dir());
		$this->assign('gif_dir',$this->get_gif_dir());
		$this->assign('png_dir',$this->get_png_dir());
		$this->assign('swf_dir',$this->get_swf_dir());
		$this->assign('js_dir',UBASE.'csincl/js/');
		$this->assign('style_dir',$this->template_rel_dir.'styles/');
		if(config::key('global','debug')) {
			$this->assign('debugging',1);
		}else{
			$this->assign('debugging',0);
		}

		$this->styles=array();
		$this->add_mod_style('default');

		$this->add_script('jquery.js');
		$this->add_script('jquery.ui.js');
		$this->add_script('jquery.geo_autocomplete.js'); 
		$this->autoload_filters=array('output'=>array('trimwhitespace'));
		$this->add_mod_style('jqueryui');	}

	static public function get_instance() {
		return isset(self::$instance) ? self::$instance : self::$instance=new self();
	}

	static public function factory() {
		return new self();
	}

	public function set_template($template) {
		$this->cur_templ=$template;
	}

	public function set_template_set($templateset) {
		if(!is_dir(CWD.'/smarty/templates/'.$templateset)) return;
		$this->template_set=$templateset;
		$this->template_rel_dir = UBASE.'smarty/templates/'.$this->template_set.'/';
		$this->template_dir = CWD.'/smarty/templates/'.$this->template_set.'/';
		$this->compile_dir  = CWD.'/smarty/templates_c/'.$this->template_set.'/';
		if(!is_dir($this->compile_dir)) mkdir($this->compile_dir);
		$this->assign('jpg_dir',$this->get_jpg_dir());
		$this->assign('gif_dir',$this->get_gif_dir());
		$this->assign('png_dir',$this->get_png_dir());
		$this->assign('swf_dir',$this->get_swf_dir());
		$this->assign('style_dir',$this->get_css_dir());
		$this->assign('stylesheet',$this->template_rel_dir.'styles.css');
	}

	public function get_template() {
		$template=$this->cur_templ;
		//if(!strpos($template,'/')) $template='db:'.$this->template_set.'/'.$template;
		//echo $template;
		return $template;
	}
	
	public function get_icon_dir() {
		return UBASE.'smarty/templates/default/images/icons/';
	}

	public function get_jpg_dir() {
		return $this->template_rel_dir.'images/jpgs/';
	}

	public function get_gif_dir() {
		return $this->template_rel_dir.'images/gifs/';
	}
	
	public function get_png_dir() {
		return $this->template_rel_dir.'images/pngs/';
	}

	private function auto_register() {
		$funcs=get_defined_functions();
		$funcs=$funcs['user'];
		foreach($funcs as $a) {
			if(substr($a,0,7)=='smarty_') {
				$this->register_function(substr($a,7),$a);
			}
		}
	}
	
	private function database_register(){
		try{
			$db = PDOClass::get_instance();
		}catch(Exception $e) {
			return;
		}
		if(!$db->is_table('modules_smarty')) return;
		$tmp=$db->query_all("SELECT * FROM `modules_smarty`");
		if(!empty($tmp) && count($tmp)){
			foreach($tmp as $t){
				if(method_exists($t['mod'], $t['method'])){
					$this->register_function($t['name'],array($t['mod'], $t['method']));
				}	
			}
		}
	}

	public function get_swf_dir() {
		return $this->template_rel_dir.'images/swfs/';
	}

	public function get_css_dir() {
		return $this->template_rel_dir.'styles/';
	}

	public function add_mod_style($module) {
		if(in_array($module,$this->styles)) return;
		$this->styles[]=$module;
	}

	public function get_styles() {
		$out=array();
		foreach($this->styles as $module) {
			if(substr($module,0,5)=='admin') {
				$mod=substr($module,5);
			}else{
				$mod=$module;
			}
			$file=CWD.'/modules/'.$mod.'/styles/'.$module.'.css';
			if(file_exists($file)) {
				$style=UBASE.'modules/'.$mod.'/styles/'.$module.'.css';
				$out[$module]=$style;
			}elseif(file_exists($this->template_dir.'styles/'.$module.'.css') && !in_array($this->get_css_dir().$module.'.css',$this->styles)) {
				$out[$module]=$this->get_css_dir().$module.'.css';
			}
		}

		return $out;
	}

	public function add_script($script) {
		$cs=$this->get_template_vars('scripts');
		if(!is_array($cs)) {
			$this->append('scripts',UBASE.'csincl/js/'.$script);
			return null;
		}
		$script=UBASE.'csincl/js/'.$script;
		if(in_array($script,$cs)) return;
		$this->append('scripts',$script);
	}

	public function __get($key) {
		switch($key) {
			case 'template_dir':
			return $this->template_dir = CWD.'/smarty/templates/'.$this->template_set.'/';
			break;
		}
		return null;
	}
}
?>
