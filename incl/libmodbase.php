<?php

class modbase {

    protected $blocks=Array();
	protected $perms=Array();
	protected $args=Array();
	protected $smarty_functions=Array();
	protected $smarty;
	protected $db;
	protected $auth;
	protected $config;
	protected $module;
	protected $depends;
	protected $major_version=0;
	protected $minor_version=0;
	protected $mod_name;
	protected $mod_icon;
	protected $adminmod=0;
	protected $auto_libs=array();
	protected $s; // Class specific session data
	protected $c; // Class config
	static $mods=array();

	public function call($method='default_method',$method_args=NULL) {

		// Set up references
		$this->auth=auth::get_instance();
		$this->smarty=smartyex::get_instance();
		$this->db=PDOclass::get_instance();
		foreach($this->auto_libs as $a) {
			$this->$a['ref']=new $a['lib']();
		}

		$sess_class='__class_'.get_class($this);
		$this->module=substr(get_class($this),3);

		// Set up class specific session link

		if(!isset($_SESSION[$sess_class])) $_SESSION[$sess_class]=array();
		$this->s=&$_SESSION[$sess_class];
		
		// Set up config values
		$this->c=new datasequence('config_values',null,null,'class',$this->module);

		// Check permissions
		// XXX Developer: for easy dumping, remove the && false below.
		if($method=='schemadump' && auth::has_access('schemadump')) {
			$this->schemadump();
			return 'It\'s Dumped';
		}

		if(!isset($this->perms[$method])) {
			$this->smarty->assign('errormsg','Sorry, the page you are looking for was not found.');
			$out=$this->smarty->fetch('error.html');
			return $out;
		}
		$args=null;
		$args=implode('/',$this->args);
		if($this->auth->can_access(get_class($this),$method)) {
			$this->get_config($this->module);
			$this->set_history($this->module,$method,$args);
			try{
				
				try{
					$out=$this->$method($method_args);
				}catch(Userexception $e) {
					if($e->getCode()==500 && !$this->auth->logged_in()) {
						$out=$this->smarty->fetch('mod:auth_loginbox.html');
						$_SESSION['auth_returnpage']=url($this->module,$method,$args,false);
					}else{
						$out=null;
					}
					return smarty_display_error(array('error'=>$e->getMessage())).$out;
				}
			}catch(Exception $e) {
			    $this->db->insert_array('error_log',array('error'=>$e->getMessage(),'backtrace'=>$e->getTraceAsString(),'uid'=>auth::get_uid(),'ip'=>$_SERVER['REMOTE_ADDR']));
				if(auth::has_access('dev')) return smarty_display_error(array('error'=>$e->getMessage()));
				return smarty_display_error(array('error'=>'An Internal Error has occured.'));
			}
			return $out;
		}else{
			if($this->auth->logged_in()) {
				$this->smarty->assign('errormsg','Sorry, you do not have permission to view this page');
				$out=$this->smarty->fetch('error.html');
				return $out;
			} 
			$this->smarty->assign('errormsg','You must be logged in to view this page. ');
			if(defined('ADMIN')) {
				echo 'admin';
				exit;
				if(strlen($args)) {
					$tmp_args=$method.'/'.$args;
				}else{
					$tmp_args=$method;
				}
				$_SESSION['auth_returnpage']=url('admin',$this->module,$tmp_args,false);
			}else{
				$_SESSION['auth_returnpage']=url($this->module,$method,$args,false);
			}
			$needle=array('admin','cms_edit');
			if(in_array($needle,$this->perms[$method])) {
				$out=$this->smarty->fetch('mod:auth_loginbox.html');
			}else{
				$out=$this->smarty->fetch('mod:auth_loginbox.html');
			}
			return $out;
		}
	}
	
	public function load_external($class){
		$class = 'mod'.$class;
		$instance = new $class;
		$instance->auth=auth::get_instance();
		$instance->smarty=smartyex::get_instance();
		$instance->db=PDOclass::get_instance();
		return $instance;
	}

	public function set_args($in) {
		$this->args=$in;
	}

	protected function default_method() {
	}

	protected function admin() {
	}

	protected function set_perms($method,$perm) {
		$this->perms[$method][]=$perm;
	}

	protected function set_all_perms($methods,$perms) {
		foreach($methods as $a) {
			if(is_array($perms)) {
				foreach($perms as $b) {
					$this->set_perms($a,$b);
				}
			}else{
				$this->set_perms($a,$perms);
			}
		}
	}

	protected function set_block($method,$block) {
		$this->blocks[$method]=$block;
	}

	protected function set_history($mod,$method,$args) {
		// Creates a history of urls visited
		if(!isset($_SESSION['modbase_history']) || !is_array($_SESSION['modbase_history'])) $_SESSION['modbase_history']=array();

		$h=&$_SESSION['modbase_history'];

		if(isset($_SERVER['REDIRECT_URL'])) {
			if(count($h) && $h[0]==$_SERVER['HTTP_HOST'].$_SERVER['REDIRECT_URL']) return;
			array_unshift($h,$_SERVER['HTTP_HOST'].$_SERVER['REDIRECT_URL']);
		}else{
			if(count($h) && $h[0]==$_SERVER['HTTP_HOST'].'/'.$mod.'/'.$method.'/'.$args) return;
			array_unshift($h,$_SERVER['HTTP_HOST'].'/'.$mod.'/'.$method.'/'.$args);
		}
		
		if(count($h) > 10) $h=array_slice($h,0,9);
	}

	protected function get_history($id=null) {
		if(!isset($_SESSION['modbase_history']) || !is_array($_SESSION['modbase_history'])) $_SESSION['modbase_history']=array();
		$h=&$_SESSION['modbase_history'];
		if($id===null) return $h;

		if(isset($h[$id])) return $h[$id];
		return null;
	}

	protected function back($offset=1) {
		$page=$this->get_history($offset);
		if($page==null) return;
		header('Location: http://'.$page);
		exit;
	}
	
	protected function get_config($module){
		$this->config = config::get_class_config($module);
	}
	
	protected function check_config($config){
		return isset($this->config[$config]);
	}

	protected function get_registered_methods() {
		return array_keys($this->perms);
	}
	
	protected function get_blocks() {
	   return array_keys($this->blocks);
	}
	
	protected function get_smarty_functions() {
		return $this->smarty_functions;
	}

	public function install() {
	    $this->db=PDOclass::get_instance();
		$mod=get_class($this);
		$db=PDOclass::get_instance();
		$this->restore_schema();
		if(!count(self::$mods)) {
		    $tmp=$this->db->query_all('SELECT `mod` FROM `modules` WHERE `type`=1');
		    foreach($tmp as $a) {
			self::$mods[]=$a;
		    }
		}
		//$tmp=$db->query_all('SELECT COUNT(`id`) AS `cnt` FROM `modules` WHERE `mod`=? AND `type`=1',array($mod));
		if(in_array($mod,self::$mods)) return;
		if($this->mod_name===null) $this->mod_name=$mod;
		$db->insert_array('modules',array('mod'=>$mod,'type'=>1,'major_version'=>$this->major_version,'minor_version'=>$this->minor_version,'name'=>$this->mod_name));
		$methods=$this->get_registered_methods();
		foreach($methods as $a) {
			$mid=$db->insert_array('auth_methods',array('mod'=>$mod,'method'=>$a));
			foreach($this->perms[$a] as $b) {
				$gid=$db->query_all('SELECT * FROM `auth_groups` WHERE `group_name`=?',array($b));
				if(!count($gid)) {
					$gid=$db->insert_array('auth_groups',array('group_name'=>$b));
				}else{
					$gid=$gid[0]['id'];
				}
				$db->insert_array('auth_group_perms',array('gid'=>$gid,'mid'=>$mid));
			}
		}
		
		$smarty_functions=$this->get_smarty_functions();
		foreach($smarty_functions as $func=>$name){
			$sid=$db->insert_array('modules_smarty', array('name'=>$name, 'method'=>$func, 'mod'=>$mod));
		}
		
		
		$mod_name=substr($mod,3);
		foreach($this->blocks as $k=>$a) {
            $db->insert_array('blocks_blocks',array('name'=>$a,'method'=>$k,'module'=>$mod_name));
		}

		if($this->adminmod==1 && is_array($this->admin_sub_menu)) {
			$this->admin_sub_menu['settings']='Settings';
			$cmod=substr(get_class($this),5);
			$tmp=$db->query_all('SELECT * FROM `modules_admin_menu` WHERE `mod`=?',array($cmod));
			$tmenu=array();
			foreach($tmp as $a) {
				if(!isset($this->admin_sub_menu[$a['menu']])) {
					$db->del('modules_admin_menu',$a['menu'],'menu');
					continue;
				}
				$tmenu[]=$a['menu'];
			}
			
			foreach($this->admin_sub_menu as $k=>$v) {
				if(!in_array($k,$tmenu)) $db->insert_array('modules_admin_menu',array('mod'=>$cmod,'method'=>$k,'menu'=>$v));
			}
		}

		$this->after_install();
	}

	public function update() {
		$mod=get_class($this);
		$db=PDOclass::get_instance();
		$this->restore_schema();
		if($this->mod_name===null) $this->mod_name=$mod;
		$db->update_array('modules',array('major_version'=>$this->major_version,'minor_version'=>$this->minor_version,'name'=>$this->mod_name),array('mod'=>$mod));
		$tmp=$db->query_all('SELECT * FROM `auth_methods` WHERE `mod`=?',array($mod));
		$methods=$this->get_registered_methods();
		$dbmeths=array();
		foreach($tmp as $a) {
			$dbmeths[]=$a['method'];
			if(!in_array($a['method'],$methods)) $db->query_all('DELETE FROM `auth_methods` WHERE `id`=?',array($a['id']));
		}

		foreach($methods as $a) {
			if(!in_array($a,$dbmeths)) {
				$methid=$db->insert_array('auth_methods',array('mod'=>$mod,'method'=>$a));
				foreach($this->perms[$a] as $b) {
					$gid=$db->query_all('SELECT * FROM `auth_groups` WHERE `group_name`=?',array($b));
					if(!count($gid)) {
						$gid=$db->insert_array('auth_groups',array('group_name'=>$b));
					}else{
						$gid=$gid[0]['id'];
					}
					$db->insert_array('auth_group_perms',array('gid'=>$gid,'mid'=>$methid));
				}
			}else{
				$methid=$db->query_all('SELECT `id` FROM `auth_methods` WHERE `mod`=? AND `method`=?',array($mod,$a));
				$methid=$methid[0]['id'];
				$tmp=$db->query_all('SELECT p.id AS `pid`,g.* 
								FROM `auth_group_perms` p 
								LEFT JOIN `auth_groups` g on p.gid=g.id 
								LEFT JOIN `auth_methods` m ON m.id=p.mid 
								WHERE m.mod=? AND m.method=?',array($mod,$a));
				$dbgroups=array();
				foreach($tmp as $b) {
					if(in_array($b['group_name'],$this->perms[$a])) {
						// The group represented in the server is still in this class
						$dbgroups[]=$b['group_name'];
						continue;
					}else{
						// This group has be deleted from the local version, but is still on the server. Remove it from the server.
						$db->del('auth_group_perms',$b['pid']);
					}
				}

				foreach($this->perms[$a] as $b) {
					if(in_array($b,$dbgroups)) continue;
					// Group is not in the server cache
					// Check to see if group exists
					$gid=$db->query_all('SELECT * FROM `auth_groups` WHERE `group_name`=?',array($b));
					if(!count($gid)) {
						// Group does not exist. Create it.
						$gid=$db->insert_array('auth_groups',array('group_name'=>$b));
					}else{
						$gid=$gid[0]['id'];
					}
					$db->insert_array('auth_group_perms',array('gid'=>$gid,'mid'=>$methid));
				}
			}
		}
		
		//Updating of smarty functions
		$smarty_functions=$this->get_smarty_functions();
		$tmp2=$db->query_all('SELECT * FROM `modules_smarty` WHERE `mod` = ?', array($mod));
		$dbsmarty=array();
		foreach($tmp2 as $c){
			$dbsmarty[]=$c['name'];
			if(!in_array($c['name'],$smarty_functions)) $db->query_all('DELETE FROM `modules_smarty` WHERE `id` = ?',array($c['id']));
		}
		
		foreach($smarty_functions as $func=>$name){
			if(!in_array($name, $dbsmarty)){
				$sid=$db->insert_array('modules_smarty',array('name'=>$name, 'method'=>$func, 'mod'=>$mod));
			}else{
				$sid=$db->update_array('modules_smarty',array('method'=>$func),array('name'=>$name));
			}
		}
		
		$mod_name=substr($mod,3);
		$db->query_all('DELETE FROM `blocks_blocks` WHERE `module`=?',array($mod_name));
		foreach($this->blocks as $k=>$a) {
            $db->insert_array('blocks_blocks',array('name'=>$a,'method'=>$k,'module'=>$mod_name));
		}

		if($this->adminmod==1 && is_array($this->admin_sub_menu)) {
			$this->admin_sub_menu['settings']='Settings';
			$cmod=substr(get_class($this),5);
			$tmp=$db->query_all('SELECT * FROM `modules_admin_menu` WHERE `mod`=?',array($cmod));
			$tmenu=array();
			foreach($tmp as $a) {
				if(!isset($this->admin_sub_menu[$a['menu']])) {
					$db->del('modules_admin_menu',$a['menu'],'menu');
					continue;
				}
				$tmenu[]=$a['menu'];
			}
			
			foreach($this->admin_sub_menu as $k=>$v) {
				if(!in_array($k,$tmenu)) $db->insert_array('modules_admin_menu',array('mod'=>$cmod,'method'=>$k,'menu'=>$v));
			}
		}
	}

	public function get_major_version() {
		return $this->major_version;
	}

	public function get_minor_version() {
		return $this->minor_version;
	}

	protected function get_mod_dir() {
		$mod=$this->get_mod_base();
		return 'modules/'.$mod.'/';
	}

	protected function get_mod_base() {
		 $mod=get_class($this);
                if(substr($mod,0,3)=='mod') {
                        $mod=substr($mod,3);
                }else{
                        $mod=substr($mod,5);
                }
		return $mod;
	}
	

	/**
	 * Schema dumper
	 * Run this after creating the module
	 * Don't forget to commit the resulting schema file.
	 * Only tables that begin with modname_ will be included in this dump!
	 */

	public function schemadump() {
		$schemafile=$this->get_mod_dir().'sqlschema.dat';
		$xmlfile=$this->get_mod_dir().'sqlschema.xml';
		$f=@fopen($schemafile,'w');
		if($f===false) throw new Exception('The schema file is not writable.');
		fclose($f);
		$f=@fopen($xmlfile,'w');
		if($f===false) throw new Exception('The XML schema file is not writable.');
		fclose($f);
		$db=PDOclass::get_instance();
		$tmp=$db->get_tables();
		$tables=array();
		$mod=get_class($this);
		if(substr($mod,0,3)=='mod') {
			$mod=substr($mod,3);
		}else{
			$mod=substr($mod,5);
		}
		foreach($tmp as $a) {
			if(substr($a,0,strlen($mod)+1)==$mod.'_') $tables[]=$a;
		}

		$out=array();

		$xml='<tables></tables>';
		$xml=new SimpleXMLElement($xml);

		foreach($tables as $a) {
			$tmp=$this->db->query_all('SHOW CREATE TABLE `'.$a.'`');
			if(isset($tmp[0]['Create Table'])) {
				$table=$xml->addChild('table',$tmp[0]['Create Table']);
				$table->addAttribute('name',$a);
				$cols=$this->db->query_all('DESCRIBE `'.$a.'`');
				$c=$xml->addChild('columns');
				$c->addAttribute('name',$a);
				foreach($cols as $b) {
					$tc=$c->addChild('column');
					foreach($b as $k=>$v) 
					$tc->addChild($k,$v);
				}
			}
			$out[]=$tmp[0];
		}

		$dom = dom_import_simplexml($xml)->ownerDocument; 
		$dom->formatOutput = true; 

		file_put_contents($xmlfile,$dom->saveXML());

		file_put_contents($schemafile,serialize($out));
	}

	/**
	 * Schema restore
	 * This will be called on install or upgrade.
	 * If the table already exists, it will not be changed!
	 */
	
	protected function restore_schema() {
		modules::restore_schema($this->get_mod_base());
		return;
		if(file_exists($this->get_mod_dir().'sqlschema.xml')) {
			$xml=simplexml_load_file($this->get_mod_dir().'sqlschema.xml');
			if($xml===false) return;
			
			for($i=0;$i<count($xml->table);$i++) {
				$db=PDOclass::get_instance();
				$out=array();
				$db->query_all('SET FOREIGN_KEY_CHECKS=0');

				// Get table name
				$att=$xml->table[$i]->attributes();
				if(empty($att['name'])) continue;
				if($db->is_table($att['name'])) {
					$cset=null;
					for($j=0;$j<count($xml->columns);$j++) {
						$cn=$xml->columns[$j]->attributes();
						if((string)$cn['name']!=(string)$att['name']) continue;
						$cset=$j;
						break;
					}
					if($cset===null) continue;
					$cols=$db->get_cols($att['name']);
					for($j=0;$j<count($xml->columns[$cset]->column);$j++) {
						$col=$xml->columns[$cset]->column[$j];
						if(in_array((string)$col->Field,$cols)) continue;
						$q='ALTER TABLE `'.$att['name'].'` ADD `'.$col->Field.'` '.$col->Type.' ';
						if(strtoupper((string)$col->Null)=='YES') {
							$q.='NULL';
						}else{
							$q.='NOT NULL';
						}
						if(!empty($col->Default)) $q.=' default '.$col->Default;
						$db->query_all($q);
					}
				}else{
					$db->beginTransaction();
					$db->query_all((string)$xml->table[$i]);
					$db->commit();
				}
				$db->query_all('SET FOREIGN_KEY_CHECKS=1');
			}

			return;
		}
		// No XML file exists, use legacy file
		if(!file_exists($this->get_mod_dir().'sqlschema.dat')) return;
		$tables=unserialize(file_get_contents($this->get_mod_dir().'sqlschema.dat'));
		if(!is_array($tables) || !count($tables)) return;

		$db=PDOclass::get_instance();
		$out=array();
		$db->beginTransaction();
		$db->query_all('SET FOREIGN_KEY_CHECKS=0');
		do{
			foreach($tables as $k=>$a) {
				if(!isset($a['Table'])) {
					unset($tables[$k]);
					continue;
				}
				if($db->is_table($a['Table'])) {
					unset($tables[$k]);
					continue;
				}

				if(!isset($a['Create Table'])) {
					unset($tables[$k]);
					continue;
				}	
				$db->query_all($a['Create Table']);
				$out[]=$a;
				unset($tables[$k]);
			}
		}while(count($tables));
		$db->commit();
		$db->query_all('SET FOREIGN_KEY_CHECKS=1');
		return $out;
	}

	/**
	 * A hook to be called after this module is installed.
	 * override it in the module. This will be called for both the admin
	 * module and the regular module, so be careful.
	 */

	protected function after_install() {
	}

	protected function add_lib($lib,$ref=null) {
		if(!is_array($this->auto_libs)) $this->auto_libs=array();
		if($ref===null) $ref='lib';
		$this->auto_libs[]=array('ref'=>$ref,'lib'=>$lib);
	}
}
?>
