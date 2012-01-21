<?php

class site {

	private $mod;
	private $method;
	private $args;
	private $admin=0;

	public function __construct() {
	}

	static public function load_module($mod,$method,$args=array()) {
		include_once('modules/'.$mod.'/mod'.$mod.'.php');
		$modname='mod'.$mod;
		$tmp=new $modname;
		$mlib=new modules();
		if(!$mlib->is_current($modname)) $tmp->update();
		if(!is_array($args)) $args=array();
		$tmp->set_args($args);
		$smarty=smartyex::get_instance();
		$smarty->assign('module',$mod);
		$smarty->assign('method',$method);
		$smarty->add_mod_style($mod);
		return $tmp->call($method);
	}

	static public function load_admin_module($mod,$method,$args=array()) {
		include_once('modules/'.$mod.'/admin'.$mod.'.php');
		$modname= 'admin'.$mod;
		$tmp=new $modname;
		$mlib=new modules();
		if(!$mlib->is_current($modname)) $tmp->update();
		if(!is_array($args)) $args=array();
		$tmp->set_args($args);
		$smarty=smartyex::get_instance();
		$smarty->assign('module',$mod);
		$smarty->assign('method',$method);
		$smarty->add_mod_style('admin'.$mod);
		return $tmp->call($method);
	}

	public function display() {
		$smarty=smartyex::get_instance();
		$cfg=config::get_class_config('global');
		$smarty->assign('page_title',$cfg['page_title']);
		$db=PDOclass::get_instance();
		if(!$db->is_table('modules')) $this->first_run();

		list($mod,$method,$args,$admin)=$this->get_args();
		$uid=null;
		if(auth::logged_in()) $uid=auth::get_uid();

		$current_user=auth::get_current_user();
		$smarty->assign('current_user',$current_user);

		if($admin) {
			$fullcontent=modules::load($mod,$method,$args,true);
			$tmp=$db->query_all('SELECT am.*, m.name FROM `modules_admin_menu` am LEFT JOIN `modules` m ON CONCAT("admin",am.mod)=m.mod ORDER BY am.mod DESC');
			$adminmenu=array();
			$auth=auth::get_instance();
			foreach($tmp as $a) {
				if(!auth::can_access('admin'.$a['mod'],$a['method'])) continue;
				if(!isset($adminmenu[$a['mod']])) {
					$adminmenu[$a['mod']]['menu']=array($a);
					$adminmenu[$a['mod']]['name']=$a['name'];
				}else{
					$adminmenu[$a['mod']]['menu'][]=$a;
				}
			}
			$smarty->assign('adminmenu', $adminmenu);
			$smarty->set_template_set('default');
			$smarty->set_template('admin.html');
		}else{
			if(isset($cfg['template_set'])) $smarty->set_template_set($cfg['template_set']);
			$fullcontent=modules::load($mod,$method,$args);
			if($smarty->template_exists('internal.html')) {
				if(!($mod=='cms' && (($method=='view' || $method=='default_method') && (!count($args) || $args[0]=='index' || $args[0]==null)))) {
					$smarty->set_template('internal.html');
				}
			}
		}
		$cmslib=new cms_lib();

		$smarty->assign('fullcont',$fullcontent);
		$smarty->assign('styles',$smarty->get_styles());
		if(!$smarty->template_exists($smarty->get_template())) $smarty->set_template('preinstall.html');
		$smarty->display($smarty->get_template());
	}

	private function get_args() {
		$cfg=config::get_class_config('global');

		if($cfg['modr'] && false) {
			if(!isset($_SERVER['REDIRECT_URL'])) {
				//define('MODULE',$cfg['default_module']);
				//return array($cfg['default_module'],'default_method',array(),false);
			}

			$admin=false;

			$tmp=explode('/',substr($_SERVER['REDIRECT_URL'],strlen(UBASE)));

			$mod=array_shift($tmp);
			if($mod=='admin') {
				$admin=true;
				if(count($tmp)) {
					$mod=array_shift($tmp);
				}else{
					$mod=$cfg['default_module'];
					//define('MODULE',$mod);
					return array($mod,'default_method',array(),true);
				}
			}elseif(!strlen($mod)) {
				$mod=$cfg['default_module'];
			}

			if(!$admin && !modules::mod_exists($mod)) return array('cms','view',array($mod),$admin);

			if(count($tmp)) {
				$method=array_shift($tmp);
				if(!strlen($method)) $method='default_method';
			}else{
				$method='default_method';
			}

			$args=array();
			foreach($tmp as $a) {
				if(strlen($a)) $args[]=$a;
			}

			return array($mod,$method,$args,$admin);
		}

		
		if(isset($_GET['module'])) {
			$mod=$_GET['module']; 
		}elseif(isset($cfg['default_module'])){
			$mod=$cfg['default_module'];	// Load default module
		}else{
			$mod='cms';
		}

		if(!isset($_GET['modmethod'])) {
			$method='default_method';
		}else{
			$method=$_GET['modmethod'];
		}

		$args=NULL;

		if(isset($_GET['args'])) $args=explode('/',$_GET['args']);

		$admin=false;

		if(!empty($_GET['adminload'])) {
			$mods=$this->get_admin_modules();
			$admin=true;
			define('ADMIN',true);
		}else{
			$mods=$this->get_modules();
		}

		if(!$admin && !modules::mod_exists($mod)) return array('cms','view',array($mod),$admin);

		if(!isset($mods[$mod])) {
			/*$pages=cms_lib::get_all_pages();
			if(in_array($mod,$pages)) {
				$args=$mod;
				$mod='cms';
				$method='view';
			}else{*/
				// Error Handling: Module does not exits, page does not exist
				// For now, load the cms page.
				$args=$mod;
				$mod='cms';
				$method='view';
			//}
		}
		//define('MODULE',$mod);
		//if(isset($method)) define('METHOD',$method);
		//if(isset($args)) define('ARGS',$args);
		//var_dump($mods);
		//exit;
		if(!is_array($args)) $args=array($args);
		return array($mod,$method,$args,$admin);
	}

	static public function get_modules() {

		static $mods=array();
		if(count($mods)) return $mods;
		$mdir=dir('modules');
		$mlib=new modules();
		while (false !== ($entry = $mdir->read())) {
			if(file_exists('modules/'.$entry.'/mod'.$entry.'.php')) $mods[$entry]='modules/'.$entry.'/mod'.$entry.'.php';
		}
		foreach(array_keys($mods) as $a) {
			if(!$mlib->mod_installed('mod'.$a)) {
				$cmod='mod'.$a;
				$tmp=new $cmod();
				$tmp->install();
			}elseif(false && !$mlib->is_current('mod'.$a)) {
				$cmod='mod'.$a;
				$tmp=new $cmod();
				$tmp->update();
			}
		}
		return $mods;
    }

	static public function get_admin_modules() {
		static $admods=array();
		if(count($admods)) return $admods;
		$mdir=dir('modules');
		while(false !== ($entry=$mdir->read())) {
			if(file_exists('modules/'.$entry.'/admin'.$entry.'.php')) $admods[$entry]='modules/'.$entry.'/admin'.$entry.'.php';
		}

		$mlib=new modules();

		foreach(array_keys($admods) as $a) {
			if(!$mlib->mod_installed('admin'.$a)) {
				include_once('modules/'.$a.'/admin'.$a.'.php');
				$cmod='admin'.$a;
				$tmp=new $cmod();
				$tmp->install();
			}
		}

		return $admods;
	}

	static public function is_admin_module($mod) {
		$mods=self::get_admin_modules();
		return isset($mods[$mod]);
	}

	static public function is_module($mod) {
		$mods=site::get_modules();
		return isset($mods[$mod]);
	}

	private function first_run() {
		$db=PDOclass::get_instance();

		if(!$db->is_table('config_values')) {
			$db->query_all('CREATE TABLE `config_values` (
						`id` int(10) unsigned NOT NULL auto_increment,
						`key` varchar(255) default NULL,
						`value` varchar(255) default NULL,
						`class` varchar(255) default NULL,
						`type` varchar(255) default NULL,
						`options` text,
						PRIMARY KEY  (`id`)
						) ENGINE=InnoDB AUTO_INCREMENT=1 DEFAULT CHARSET=utf8;');
		}

		if(!$db->is_table('modules')) {
			$db->query_all('CREATE TABLE `modules` (
						`id` int(10) unsigned NOT NULL auto_increment,
						`mod` varchar(100) default NULL,
						`path` varchar(100) default NULL,
						`name` varchar(100) default NULL,
						`type` tinyint(4) default NULL,
						`major_version` int(11) default NULL,
						`minor_version` int(11) default NULL,
						PRIMARY KEY  (`id`),
						KEY `NewIndex1` (`mod`)
						) ENGINE=InnoDB AUTO_INCREMENT=1 DEFAULT CHARSET=utf8');
		}

		if(!$db->is_table('modules_admin_menu')) {
			$db->query_all('CREATE TABLE `modules_admin_menu` (
						`id` int(10) unsigned NOT NULL auto_increment,
						`mod` varchar(100) default NULL,
						`method` varchar(100) default NULL,
						`menu` varchar(100) default NULL,
						PRIMARY KEY  (`id`)
						) ENGINE=InnoDB AUTO_INCREMENT=1 DEFAULT CHARSET=utf8;');
		}

		if(!$db->is_table('modules_depends')) {
			$db->query_all('CREATE TABLE `modules_depends` (
						`id` int(10) unsigned NOT NULL auto_increment,
						`modid` int(10) unsigned default NULL,
						`depends` int(10) unsigned default NULL,
						PRIMARY KEY  (`id`)
						) ENGINE=InnoDB DEFAULT CHARSET=utf8;');
		}

		if(!$db->is_table('modules_smarty')){
			$db->query_all('CREATE TABLE `modules_smarty` (
						`id` int(11) NOT NULL auto_increment,
						`mod` varchar(255) default NULL,
						`method` varchar(255) default NULL,
						`name` varchar(255) default NULL,
						`static` tinyint(1) default "0",
						PRIMARY KEY  (`id`)
						) ENGINE=InnoDB AUTO_INCREMENT=95 DEFAULT CHARSET=latin1');
		}

		if(!$db->is_table('error_log')) {
			$db->query_all('CREATE TABLE `error_log` (
						`id` int(10) unsigned NOT NULL auto_increment,
						`error` text,
						`backtrace` text,
						`ts` timestamp NOT NULL default CURRENT_TIMESTAMP on update CURRENT_TIMESTAMP,
						`uid` int(11) default NULL,
						`ip` varchar(20) default NULL,
						PRIMARY KEY  (`id`)
						) ENGINE=InnoDB DEFAULT CHARSET=utf8');
		}

		if(!$db->is_table('pfiles')) {
			$db->query_all('CREATE TABLE `pfiles` (                                                              
						`id` INT(10) UNSIGNED NOT NULL AUTO_INCREMENT,                                     
						`filename` VARCHAR(255) DEFAULT NULL,                                              
						`filedata` LONGBLOB,                                                               
						`mtime` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,  
						`atime` DATETIME DEFAULT NULL,                                                     
						`ctime` DATETIME DEFAULT NULL,                                                     
						PRIMARY KEY  (`id`)                                                                
						) ENGINE=MYISAM');
		}

		if(!$db->is_table('files')) {
			$db->query_all('CREATE TABLE `files` (
						`id` int(10) unsigned NOT NULL auto_increment,
						`filename` char(32) default NULL,
						`original` varchar(255) default NULL,
						`status` int(11) NOT NULL default "1",
						`ts` timestamp NOT NULL default CURRENT_TIMESTAMP on update CURRENT_TIMESTAMP,
						PRIMARY KEY  (`id`)
						) ENGINE=InnoDB DEFAULT CHARSET=utf8');
		}

		if(!$db->is_table('blocks_blocks')) {
			$db->query_all('CREATE TABLE `blocks_blocks` (
						`id` int(11) NOT NULL auto_increment,
						`name` varchar(100) default NULL,
						`method` varchar(255) default NULL,
						`module` varchar(255) default NULL,
						`cont_id` int(11) NOT NULL default "0",
						`display_header` tinyint(4) NOT NULL default "1",
						PRIMARY KEY  (`id`),
						KEY `container index` (`cont_id`)
						) ENGINE=MyISAM DEFAULT CHARSET=utf8');
		}

		if(!$db->is_table('blocks_containers')) {
			$db->query_all('CREATE TABLE `blocks_containers` (
						`id` int(11) NOT NULL auto_increment,
						`name` varchar(100) default NULL,
						PRIMARY KEY  (`id`)
						) ENGINE=MyISAM DEFAULT CHARSET=utf8');
		}

		modules::restore_schema('auth');
	}

}
?>
