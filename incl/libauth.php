<?php

class auth {

	private $db;
	private $is_logged_in=false;
	private $uid=0;
	private static $instance;
	private static $current_user;

	public function __construct() {
		$this->db=PDOclass::get_instance();
		modules::depends('modauth');
		$this->restore();
	}

	static public function get_instance() {
		return isset(self::$instance) ? self::$instance : self::$instance=new self();
	}

	/**
	 * Authentication methods
	 */

	public function login($email,$pass,$remember=false) {
		if(!strlen($email)) throw new Exception('Your email address must not be blank');
		if(!strlen($pass)) throw new Exception('Your password must not be blank');
		$tmp=$this->db->query_all('SELECT * FROM `auth_users` WHERE `email`=? AND `password`=?',array($email,md5($pass)));
		if(!count($tmp)) throw new Exception('Login Failed');
		$uid=$tmp[0]['id'];
		if(!self::has_access('login',$uid,false)) throw new Exception('Your account has been disabled. Please use the contact us page to notify the site admins '.$uid);
		$this->auto_login($uid,null,$remember);
		$this->db->insert_array('auth_lastlog',array('uid'=>$uid));
	}

	public function auto_login($uid,$token=null,$remember=false) {
		if(!$this->user_exists($uid)) return false;
		$this->uid=$uid;
		$this->is_logged_in=true;
		$where=array('uid'=>$uid);
		if($token!==null) {
			$where=array('token'=>$token);
			$this->db->update_array('auth_status',array('status'=>1,'ts'=>null),$where);
		}else{
			$token=$this->create_token($remember);
			$this->db->insert_array('auth_status',array('uid'=>$uid,'status'=>1,'token'=>$token,'session_start'=>date('Y-m-d H:i:s')));
		}
	}

	public function logout() {
		$this->is_logged_in=false;
		$token=$this->get_token();
		$this->db->query_all('DELETE FROM `auth_status` WHERE `token`=?',array($token));
		$this->delete_token();
	}

	private function restore() {
		$token=$this->get_token();
		if($token===null) return false;
		$tmp=$this->db->query_all('SELECT * FROM `auth_status` WHERE `token`=?',array($token));
		if(!count($tmp)) {
			$this->delete_token();
			return false;
		}
		$this->auto_login($tmp[0]['uid'],$token);
		$this->db->query_all('UPDATE `auth_status` SET ts=NULL, `status`=1 WHERE `token`=?',array($token));
		$this->db->query_all('UPDATE `auth_status` SET `status`=0 WHERE `ts`<? AND `status`=1',array(date('Y-m-d H:i:s',mktime(date('H')-3,date('i'),date('s')))));
	}

	static public function has_access($perm,$uid=null,$checklogin=true) {
		if($uid===null) $uid=self::get_uid();
		// if $perm is an array, check each of the permissions contained in it. If one of them matches, return true
		if(is_array($perm)) {
			foreach($perm as $a) {
				if(self::has_access($a,$uid)) return true;
			}
			return false;
		}

		if($perm=='public') return true; // Anyone can access public

		if(!self::logged_in() && $checklogin) return false; // All other permissions require the user to be logged in

		if($perm=='authenticated') return true; // User is logged in, that's all we care about here

		$auth=self::get_instance();

		$drid=self::get_role_id('Developer');
		if($auth->user_has_role($uid,$drid)) return true; // Developers can do anything they want.

		$db=PDOclass::get_instance();
		// Check role methods
		$tmp=$db->query_all('SELECT COUNT(rm.id) AS `cnt`
								FROM `auth_role_members` rm
								LEFT JOIN `auth_role_groups` rg ON rm.rid=rg.rid
								LEFT JOIN `auth_groups` g ON rg.gid=g.id
								WHERE rm.uid=? AND g.group_name=?',array($uid,$perm));

		if($tmp[0]['cnt']>0) return true;
		// Finally, check individually granted permissions
        $tmp=$db->query_all('SELECT g.* FROM `auth_group_members` gm LEFT JOIN `auth_groups` g ON gm.gid=g.id WHERE gm.uid=? AND g.group_name=?',array($uid,$perm));
		if(count($tmp)) return true;
		return false;
	}

	static public function can_access($mod,$method,$uid=null) {

		if($uid===null) $uid=self::get_uid();
		// Check to see if the method is public
		$db=PDOclass::get_instance();

		$tmp=$db->query_all('SELECT COUNT(gp.id) AS `cnt` FROM `auth_group_perms` gp
								LEFT JOIN `auth_methods` m ON gp.mid=m.id
								LEFT JOIN `auth_groups` g ON gp.gid=g.id
								WHERE m.mod=? AND m.method=? AND g.group_name=?',array($mod,$method,'public'));
		if($tmp[0]['cnt']>0) return true;

		// Is this open to authenticated users?

		$tmp=$db->query_all('SELECT COUNT(gp.id) AS `cnt` FROM `auth_group_perms` gp
								LEFT JOIN `auth_methods` m ON gp.mid=m.id
								LEFT JOIN `auth_groups` g ON gp.gid=g.id
								WHERE m.mod=? AND m.method=? AND g.group_name=?',array($mod,$method,'authenticated'));
		if($tmp[0]['cnt']>0 && self::logged_in()) return true;

		// Is this user a developer?

		if(self::logged_in()) {
			$auth=self::get_instance();
			$drid=self::get_role_id('Developer');
			if($auth->user_has_role(self::get_uid(),$drid)) return true;
		}

		// Check if user's roles can access this method

		$tmp=$db->query_all('SELECT gp.gid, gp.access, m.mod, m.method, g.group_name, rg.rid, r.name AS `role_name`
							FROM `auth_group_perms` gp
							LEFT JOIN `auth_methods` m ON gp.mid=m.id
							LEFT JOIN `auth_groups` g ON gp.gid=g.id
							LEFT JOIN `auth_role_groups` rg ON rg.gid=g.id
							LEFT JOIN `auth_roles` r ON rg.rid=r.id
							LEFT JOIN `auth_role_members` rm ON rm.rid=rg.rid
							WHERE rg.id IS NOT NULL AND rm.uid=? AND m.mod=? AND m.method=?',array($uid,$mod,$method));
		if(count($tmp)) return true;

		// The user has no roles, check to see if the user has individual permissions

		$tmp=$db->query_all('SELECT * FROM `auth_methods` m
							LEFT JOIN `auth_group_perms` p ON p.mid=m.id
							LEFT JOIN `auth_group_members` gm ON gm.gid=p.gid
							LEFT JOIN `auth_groups` g ON gm.gid=g.id
							WHERE g.id IS NOT NULL AND gm.uid=? AND m.mod=? AND m.method=?',array($uid,$mod,$method));
		if(count($tmp)) return true;

		// Nothing worked. Failure.
		return false;
	}

	public function create_token($remember=false) {
		$token=md5('badger badger'.microtime().'this is a salty token!');
		$_SESSION['auth_token']=$token;
		if($remember) setcookie('ca_a_l',$token,time()+(3600*24*31),UBASE);
		return $token;
	}

	public function get_token() {
		if(!empty($_SESSION['auth_token'])) return $_SESSION['auth_token'];
		if(!empty($_COOKIE['ca_a_l'])) return $_COOKIE['ca_a_l'];
		return null;
	}

	public function delete_token() {
		if(isset($_SESSION['auth_token'])) unset($_SESSION['auth_token']);
		setcookie('ca_a_l',null,time()-(3600*24*31),UBASE);
	}

	static public function create_reset_request($email) {
		$db=PDOclass::get_instance();

		$tmp=$db->query_all('SELECT `id` FROM `auth_users` WHERE `email`=?',array($email));

		if(!count($tmp)) throw new Exception('Sorry, the email that you entered was incorrect.'); // Email address does not exist in the system
		$uid=$tmp[0]['id'];

		$tmp=$db->query_all('SELECT * FROM `auth_password_reset` WHERE `uid`=?',array($uid));
		if(count($tmp)) return $tmp[0]['key']; // A reset request already exists. Send that on instead.

		$key=md5('Salty keys tastebetter'.microtime());
		$db->insert_array('auth_password_reset',array('uid'=>$uid,'key'=>$key));
		return $key;
	}

	static public function validate_reset_request($key) {
		$db=PDOclass::get_instance();

		$tmp=$db->query_all('SELECT * FROM `auth_password_reset` WHERE `key`=?',array($key));
		if(!count($tmp)) throw new Exception('The key you have entered is not correct. Please try again');
		return $tmp[0]['uid'];
	}

	/**
	* Group methods
	*/

	public function get_groups($uid=null) {
		if($uid===null) {
			$uid=self::get_uid();
		}
		$tmp=$this->db->query_all('SELECT g.* FROM `auth_group_members` m LEFT JOIN `auth_groups` g ON m.gid=g.id WHERE m.uid=?',array($uid));
		return $tmp;
	}

	public function get_gid($gname) {
		if(!$this->group_exists($gname)) return $this->add_group($gname);
		$tmp=$this->db->query_all('SELECT `id` FROM `auth_groups` WHERE `group_name`=?',array($gname));
		return $tmp[0]['id'];
	}

	public function get_group_name($gid) {
		$tmp=$this->db->query_all('SELECT `group_name` FROM `auth_groups` WHERE `id`=?',array($gid));
		if(!count($tmp)) return null;
		return $tmp[0]['group_name'];
	}

	public function group_exists($gname) {
		$tmp=$this->db->query_all('SELECT COUNT(`id`) AS `cnt` FROM	`auth_groups` WHERE `group_name`=?',array($gname));
		return ($tmp[0]['cnt']) ? true : false;
	}

	public function get_group_permissions($gid=null) {
		$where=null;
		$search=null;
		if($gid!==null) {
			$where=' WHERE `gid`=?';
			$search=array($gid);
		}
		$tmp=$this->db->query_all('SELECT m.method, gp.*, g.group_name, ms.name FROM `auth_methods` m LEFT JOIN `auth_group_perms` gp ON gp.mid=m.id LEFT JOIN `auth_groups` g ON g.id=gp.gid LEFT JOIN `modules` ms ON ms.mod=m.mod'.$where, $search);
		return $tmp;
	}

	public function get_all_groups() {
		$tmp=$this->db->query_all('SELECT * FROM `auth_groups` WHERE `meta`=0 ORDER BY `group_name`');
		return $tmp;
	}

	public function add_group($gname) {
		if($this->group_exists($gname)) return $this->get_gid($gname);
		return $this->db->insert_array('auth_groups',array('group_name'=>$gname));
	}

	/**
	 * Role Methods
	 */

	public function get_all_roles() {
		$rid=$this->get_role_id('Developer');
		if($this->user_has_role(self::get_uid(),$rid)) {
			$tmp=$this->db->query_all('SELECT * FROM `auth_roles` ORDER BY `name`');
		}else{
			$tmp=$this->db->query_all('SELECT * FROM `auth_roles` WHERE `name`!=? ORDER BY `name`',array('Developer'));
		}
		return $tmp;
	}

	public function get_role_name($rid) {
		$tmp=$this->db->query_all('SELECT `name` FROM `auth_roles` WHERE `id`=?',array($rid));
		return $tmp[0]['name'];
	}

	static public function get_role_id($role) {
		$db=PDOclass::get_instance();
		$tmp=$db->query_all('SELECT `id` FROM `auth_roles` WHERE `name`=?',array($role));
		if(!count($tmp)) return null;
		return $tmp[0]['id'];
	}

	public function add_role($role,$builtin=false) {
		if(!strlen($role)) throw new Exception('The role name must not be blank');
		if($this->role_exists($role)) throw new Exception('The role you entered already exists');
		$in=array('name'=>$role);
		if($builtin) $in['builtin']=1;
		return $this->db->insert_array('auth_roles',$in);
	}

	public function delete_role($rid) {
		$this->db->del('auth_roles',$rid,null,array('builtin'=>0));
	}

	public function role_exists($role) {
		$tmp=$this->db->query_all('SELECT COUNT(`id`) AS `cnt` FROM `auth_roles` WHERE `name`=?',array($role));
		if($tmp[0]['cnt']==0) return false;
		return true;
	}

	public function add_role_group($rid,$gid) {
		if($this->role_has_group($rid,$gid)) return;
		$this->db->insert_array('auth_role_groups',array('rid'=>$rid,'gid'=>$gid));
	}

	public function delete_role_group($rid,$gid) {
		$this->db->del('auth_role_groups',$rid,'rid',array('gid'=>$gid));
	}

	public function role_has_group($rid,$gid) {
		$tmp=$this->db->query_all('SELECT COUNT(`id`) AS `cnt` FROM `auth_role_groups` WHERE `rid`=? AND `gid`=?',array($rid,$gid));
		if($tmp[0]['cnt']==0) return false;
		return true;
	}

	public function get_role_groups($rid) {
		$tmp=$this->db->query_all('SELECT g.* FROM `auth_role_groups` rg LEFT JOIN `auth_groups` g ON rg.gid=g.id WHERE rg.rid=?',array($rid));
		return $tmp;
	}

	/**
	 * Informational methods
	 */

	static public function get_username($uid=null) {
		if($uid===null) {
			$uid=self::get_uid();
		}
		if($uid==0) return 'Guest';
		$tmp=$this->db->query_all('SELECT * FROM `auth_users` WHERE `id`=?',array($uid));
		if(!count($tmp)) return 'Guest';
		return $tmp[0]['username'];
	}

	static public function get_email($uid=null) {
	}

	static public function email_exists($email) {
		$db=PDOClass::get_instance();
		$tmp=$db->query_all('SELECT COUNT(`id`) AS `cnt` FROM `auth_users` WHERE `email`=?',array($email));
		if($tmp[0]['cnt']==0) return false;
		return true;
	}

	static public function get_uid() {
		$auth=self::get_instance();
		return $auth->uid;
	}

	static public function logged_in() {
		$auth=self::get_instance();
		return $auth->is_logged_in;
	}

	static public function user_exists($uid) {
		$db=PDOclass::get_instance();
		$tmp=$db->query_all('SELECT `id` FROM `auth_users` WHERE `id`=?',array($uid));
		if(!count($tmp)) return false;
		return true;
	}

	static public function get_start_page() {
		$config=config::get_class_config('auth');
		if(self::has_access('admin')) return url('admin');
		$auth=self::get_instance();
		$uid=self::get_uid();
		return url($config['auth_start_mod'],$config['auth_start_method']); // use values from config file
	}

	static public function get_current_user() {
		return new auth_user(self::get_uid());
	}

	static public function username_exists($username) {
		$db=PDOclass::get_instance();
		$tmp=$db->query_all('SELECT `id` FROM `auth_users` WHERE `username`=?',array($username));
		if(count($tmp)) return true;
		return false;
	}

	/**
	 * User management methods
	 */

	public function get_all_users($order=null,$asc=true,$rid=null) {
		if($order!==null) {
			$cols=$this->db->get_cols('auth_users');
			if(!in_array($order,$cols)) $order=null;
		}
		if($order===null) $order='name';
		if($asc) {
			$dir='ASC';
		}else{
			$dir='DESC';
		}
		if($rid===null) {
			$tmp=$this->db->query_all('SELECT * FROM `auth_users` ORDER BY `'.$order.'` '.$dir);
		}else{
			$order='u.'.$order;
			$tmp=$this->db->query_all('SELECT u.* FROM `auth_users` u LEFT JOIN `auth_role_members` m ON u.id=m.uid WHERE m.rid=? ORDER BY '.$order.' '.$dir,array($rid));
		}
		return $tmp;
	}

	public function get_user_roles($uid=null) {
		if($uid===null) $uid=self::get_uid();
		$tmp=$this->db->query_all('SELECT * FROM `auth_role_members` r LEFT JOIN `auth_roles` o ON o.id=r.rid WHERE r.uid=? ORDER BY o.name',array($uid));
		return $tmp;
	}

	static public function user_has_role($uid,$rid) {
		$db=PDOclass::get_instance();
		$tmp=$db->query_all('SELECT COUNT(`id`) AS `cnt` FROM `auth_role_members` WHERE `rid`=? AND `uid`=?',array($rid,$uid));
		if($tmp[0]['cnt']==0) return false;
		return true;
	}

	public function add_user_role($uid,$rid) {
		if($this->user_has_role($uid,$rid)) return;
		$this->db->insert_array('auth_role_members',array('uid'=>$uid,'rid'=>$rid));
	}

	public function user_add_group($uid,$gid) {
	}

	public function delete_user_role($uid,$rid) {
		$this->db->del('auth_role_members',$uid,'uid',array('rid'=>$rid));
	}

	public function get_user($uid) {
		$tmp=$this->db->query_all('SELECT * FROM `auth_users` WHERE `id`=?',array($uid));
		return $tmp[0];
	}

	public function add_user($email,$password,$rid,$username,$name,$extra=array()) {
		if(empty($email)) throw new Exception('Email address must not be blank');
		if(empty($password)) throw new Exception('Password must not be blank');
		if($this->email_exists($email)) throw new Exception('Email address already exists in the system');
		$user=new auth_user();
		$user->create(array('email'=>$email,'password'=>$password,'username'=>$username,'name'=>$name));
		$uid=$user->id;
		//$extra=forms::filter(array('dob','gender'),$extra);
		//if(count($extra)) $this->db->update_array('auth_users',$extra,array('id'=>$uid));
		$this->add_user_role($uid,$rid);
		$this->enable_user($uid);
		return $uid;
	}

	public function delete_user($uid) {
		if($uid==self::get_uid()) throw new Exception('You can not delete your own account!');
		$this->db->del('auth_users',$uid);
	}

	public function get_user_groups($uid=null) {
		if($uid===null) $uid=self::get_uid();
		$tmp=$this->db->query_all('SELECT g.* FROM `auth_role_groups` rg LEFT JOIN `auth_role_members` rm ON rm.rid=rg.rid LEFT JOIN `auth_groups` g ON g.id=rg.gid WHERE rm.uid=?',array($uid));
		return $tmp;
	}

	public function add_user_group($uid,$gid) {
		if(is_int($gid)) {
			$gname=$this->get_group_name($gid);
		}else{
			$gname=$gid;
			$gid=$this->get_gid($gid);
		}
		if($gname===null) return;
		if(self::has_access($gname,$uid)) return;
		$this->db->insert_array('auth_group_members',array('gid'=>$gid,'uid'=>$uid));
	}

	public function delete_user_group($uid,$gid) {
		if(is_string($gid)) {
			$gid=$this->get_gid($gid);
		}
		$this->db->del('auth_group_members',$uid,'uid',array('gid'=>$gid));
	}

	public function disable_user($uid) {
		$this->delete_user_group($uid,'login');
	}

	public function enable_user($uid) {
		$this->add_user_group($uid,'login');
	}

	static public function email_validated() {
		return true;
	}

	static public function get_public_username($uid=null) {
		if($uid===null) $uid=auth::get_uid();
		$user=new auth_user($uid);
		if($user->is_loaded()) return $user->username;
		return null;
	}

	public function get_role_members($role) {
		$tmp=$this->db->query_all('SELECT u.* FROM `auth_role_members` m LEFT JOIN `auth_roles` r ON r.id=m.rid
									LEFT JOIN `auth_users` u ON u.id=m.uid WHERE r.name=?',array($role));
		return $tmp;
	}

}

?>
