<?php

class sessions {

	static private $db;
	
	public function __construct() {
		self::$db=PDOclass::get_instance();
	}

	static public function open($save_path, $name) {
		return true;
	}

	static public function close() {
		return true;
	}

	static public function read($id) {
		//echo "Reading for id: $id<br/><br/>\n";
		if(!self::$db->is_table('auth_sessions')) return (string)null;
		$tmp=self::$db->query_all('SELECT * FROM `auth_sessions` WHERE `session_key`=?',array($id));
		if(is_array($tmp) && count($tmp)) {
			return (string)$tmp[0]['session_data'];
		}
		return (string)null;
	}

	static public function write($id, $data) {
		//echo "Writing: id=$id".' '."data=$data<br/>";
		if(!self::$db->is_table('auth_sessions')) return true;
		$tmp=self::$db->query_all('SELECT * FROM `auth_sessions` WHERE `session_key`=?',array($id));
		$in=array('session_data'=>$data,'update_ts'=>time(),'session_key'=>$id,'ip'=>$_SERVER['REMOTE_ADDR']);
		$auth=auth::get_instance();
		if(auth::has_access('authenticated')) {
			$in['uid']=auth::get_uid();
		}
		if(is_array($tmp) && count($tmp)) {
			self::$db->update_array('auth_sessions',$in,array('session_key'=>$id));
		}else{
			$in['start_ts']=time();
			self::$db->insert_array('auth_sessions',$in);
		}
		return true;
	}

	static public function destroy($id) {
		self::$db->query_all('DELETE FROM `auth_sessions` WHERE `session_key`=?',array($id));
	}

	static public function gc($maxlifetime) {
		self::$db->query_all('DELETE FROM `auth_sessions` WHERE `update_ts`<?',array(time()-$maxlifetime));
		return true;
	}
}

?>
