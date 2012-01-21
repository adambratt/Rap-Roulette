<?php

class adminbase extends modbase {

	protected $adminmod=1;

	protected $admin_sub_menu=array();

	public function __construct() {
	}

	public function call($method='default_method',$method_args=NULL) {
		$this->auth=auth::get_instance();
		$this->smarty=smartyex::get_instance();
		$this->db=PDOclass::get_instance();

		$this->set_perms('settings','admin');
		
		// Set up config values
		$this->c=new datasequence('config_values',null,null,'class',$this->module);

		// Set admin menus
		$this->smarty->assign('adminmenu',$this->get_admin_menu());
		$config=$this->db->query_all('SELECT * FROM `config_values` WHERE `class`=?',array(substr(get_class($this),5)));
		if(count($config)) $this->admin_sub_menu['settings']='Settings';
		$this->smarty->assign('adminsub',$this->get_admin_sub_menu());

		$mod=substr(get_class($this),5);
		$this->smarty->assign('module',$mod);
		/**
		 * No permission for the called method was found. return page not found error
		 */
		if(!isset($this->perms[$method])) {
			$this->smarty->assign('errormsg','Sorry, the page you are looking for was not found.');
			$out=$this->smarty->fetch('error.html');
			return $out;
		}
		$args=null;
		if(defined('ARGS')) $args=ARGS;
		/**
		 * The current user has permission and the method exists. Return method output
		 */
		if(auth::can_access(get_class($this),$method)) {
			$this->set_history($mod,$method,$args);
			try{

				try{
					$out=$this->$method($method_args);
				}catch(Userexception $e) {
					return smarty_display_error(array('error'=>$e->getMessage()));
				}
			}catch(Exception $e) {
				$out=$e->getMessage();
			}
			return $out;
		}else{
			/**
			 * User does not have access
			 */
			if($this->auth->logged_in()) {
				$this->smarty->assign('errormsg','Sorry, you do not have permission to view this page');
				$out=$this->smarty->fetch('error.html');
				return $out;
			}
			$this->smarty->assign('errormsg','You must be logged in to view this page. ');
			$_SESSION['auth_returnpage']=aurl();
			header('Location: http://'.url('auth','login'));
			exit;
			//$needle=array('admin','cms_edit');
			//$out=$this->smarty->fetch('mod:auth_loginbox.html');
			//$this->smarty->assign('fullcont',$out);
			//$this->smarty->display('index.html');
			//exit;
			//return $out;
		}
	}

	private function get_admin_menu() {
		$mods=site::get_admin_modules();
		$mods=array_keys($mods);
		$out=array();
		foreach($mods as $a) {
			if(auth::has_access($a.'_admin')) $out[]=$a;
		}

		return $out;
	}

	private function get_admin_sub_menu() {
		if(!is_array($this->admin_sub_menu)) return array();
		$out=array();
		$mod=get_class($this);
		foreach($this->admin_sub_menu as $k=>$v) {
			//if(!isset($this->perms[$k])) continue;
			if(!auth::can_access($mod,$k)) continue;
			$out[]=array('method'=>$k,'title'=>$v);
		}

		return $out;
	}

	protected function settings() {
		
		$class=substr(get_class($this),5);

		if(count($_POST)) {
			//var_dump($_POST);
			foreach($_POST as $k=>$v) {
				$this->db->query_all('UPDATE `config_values` SET `value`=? WHERE `key`=? AND `class`=?',array($v,$k,$class));
			}
			header('Location: http://'.url('admin',$class,'settings'));
			exit;
		}
		
		$tmp=$this->db->query_all('SELECT * FROM `config_values` WHERE `class`=?',array($class));
		if(!count($tmp)) {
			return 'There are no editable settings for this module.';
		}

		$config=array();

		foreach($tmp as $a) {
			$config[$a['key']]=$a['value'];
		}

		$this->smarty->assign('config_settings',$tmp);
		return $this->smarty->fetch('admin_settings.html');
	}
}

?>