<?php

class modules {

	private $db;

	static private $mods=array();
	static private $admods=array();

	public function __construct() {
		$this->db=PDOclass::get_instance();
	}

	static public function mod_installed($mod) {
		$db=PDOclass::get_instance();
		$tmp=$db->query_all('SELECT COUNT(`id`) AS `cnt` FROM `modules` WHERE `mod`=? AND `type`=1',array($mod));
		if($tmp[0]['cnt']==0) return false;
		return true;
	}

	public function is_current($mod) {
		if(!$this->mod_installed($mod)) return false;
		$cmod=new $mod();
		$tmp=$this->db->query_all('SELECT * FROM `modules` WHERE `mod`=?',array($mod));
		$major=$cmod->get_major_version();
		$minor=$cmod->get_minor_version();
		if($major>$tmp[0]['major_version']) return false;
		if($minor>$tmp[0]['minor_version']) return false;
		return true;
	}

	public function admin_mod_installed($mod) {
	}

	static public function load($mod,$method=null,$args=array(),$admin=false,$loadonly=false) {
		$cfg=config::get_class_config('global');
		if(($admin && !self::admin_mod_exists($mod)) || (!$admin && !self::mod_exists($mod))) {
			$mod=$cfg['default_module'];
		}
		if($admin) {
			$modfile='modules/'.$mod.'/admin'.$mod.'.php';
			$modname= 'admin'.$mod;
		}else{
			$modname='mod'.$mod;
			$modfile='modules/'.$mod.'/mod'.$mod.'.php';
		}

		if(!file_exists($modfile)) return 'A general error has occured';
		include_once($modfile);

		$tmp=new $modname();

		$mlib=new self();

		if(!$mlib->mod_installed($modname)) {
			self::restore_schema($mod);
			$tmp->install();
		}

		if(!$mlib->is_current($modname)) $tmp->update();

		if($loadonly) return $tmp;
		$tmp->set_args($args);
		$smarty=smartyex::get_instance();
		$smarty->assign('module',$mod);
		$smarty->assign('method',$method);
		$smarty->assign('args',$args);
		if($admin){
			$smarty->add_mod_style('admin'.$mod);
		}else{
			$smarty->add_mod_style($mod);
		}
		$smarty->assign('mod_img_dir',UBASE.'modules/'.$mod.'/images/');
		return $tmp->call($method);
	}

	static public function install($mod) {
	}

	static public function restore_schema($mod) {
		$moddir=CWD.'/modules/'.$mod.'/sqlschema.dat';
		if(!file_exists($moddir)) return;
		$tables=unserialize(file_get_contents($moddir));
		if(!is_array($tables) || !count($tables)) return;

		$t_cache=array(); // Keep track of tables we have created

		$db=PDOclass::get_instance();
		$out=array();
		$db->beginTransaction();
		$db->query_all('SET FOREIGN_KEY_CHECKS=0');
		do{
			foreach($tables as $k=>$a) {
				if($db->is_table($a['Table']) || in_array($a['Table'],$t_cache)) {
					unset($tables[$k]);
					continue;
				}
				try{
					$db->query_all($a['Create Table']);
				}catch(PDOException $e) {
				}
				$t_cache[]=$a['Table'];
				$out[]=$a;
				unset($tables[$k]);
			}
		}while(count($tables));
		$db->commit();
		$db->query_all('SET FOREIGN_KEY_CHECKS=1');
		return $out;
	}

	static public function update($mod) {
	}

	static public function mod_exists($mod) {
		$mods=site::get_modules();
		return isset($mods[$mod]);
	}

	static public function admin_mod_exists($mod) {
		$mods=self::get_admin_modules();
		return isset($mods[$mod]);
	}

	static public function get_modules() {
		if(count(self::$mods)) return self::$mods;
		$mdir=dir('modules');
		$mlib=new self();
		
		while (false !== ($entry = $mdir->read())) {
			if(file_exists('modules/'.$entry.'/mod'.$entry.'.php')) $mods[$entry]='modules/'.$entry.'/mod'.$entry.'.php';
		}

		foreach(array_keys($mods) as $a) {
			if(!$mlib->mod_installed('mod'.$a)) {
				$cmod='mod'.$a;
				$tmp=new $cmod();
				$tmp->install();
			}
		}
		return self::$mods;
	}
	
	static public function get_admin_modules() {
		if(count(self::$admods)) return self::$admods;
		$mdir=dir('modules');
		while(false !== ($entry=$mdir->read())) {
			if(file_exists('modules/'.$entry.'/admin'.$entry.'.php')) self::$admods[$entry]='modules/'.$entry.'/admin'.$entry.'.php';
		}

		$mlib=new self();

		foreach(array_keys(self::$admods) as $a) {
			if(!$mlib->mod_installed('admin'.$a)) {
				include_once('modules/'.$a.'/admin'.$a.'.php');
				$cmod='admin'.$a;
				$tmp=new $cmod();
				$tmp->install();
			}
		}

		return self::$admods;
	}

	static public function depends($mod,$major=null,$minor=null) {
		if(substr($mod,0,3)!='mod' && substr($mod,0,5)!='admin') $mod='mod'.$mod;
		$type=(substr($mod,0,3)=='mod') ? 'mod' : 'admin';
		if($type=='mod') {
			$admin=false;
			$modname=substr($mod,3);
			if(!self::mod_exists($modname)) throw new Exception('A required module does not exist! ('.$modname.')');
		}else{
			$admin=true;
			$modname=substr($mod,5);
			if(!self::admin_mod_exists($modname)) throw new Exception('A required admin module does not exist! ('.$modname.')');
		}

		if(self::mod_installed($mod)) return true;
		self::load($modname,null,array(),$admin,true);
	}

	static public function get_mod_dir($mod) {
		return 'modules/'.$mod.'/';
	}

}
?>
