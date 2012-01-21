<?php
/* PDOclass

Last edit: 2008-02-06

simple extension of the PDO object
	* Uses a configuration object to retrive connection information
	* Has a singlton interface. Use PDOclass::get_instance() to get the class instance.
		* Will not connect until after it is first used

*/

class PDOclass extends PDO {

	private static $handle; // single instance of this class
	private static $loaded=false;
	private $lquery;
	static $queries=array();
	static $cache=array();

	public function __construct($user=null,$pass=null,$dbname=null,$host='127.0.0.1') {

		$config=config::get_class_config(__CLASS__); // requires config class, config options are in .htconfig.ini

		if($user===null) {
			// Get the connection string
			if(empty($config['dbconnection'])) {
				$dbconnection='mysql:';
				if(!empty($config['dbname'])) {
					$dbconnection.='dbname='.$config['dbname'].';';
				}
				if(!empty($config['dbhost'])) {
					$dbconnection.='host='.$config['dbhost'].';';
				}else{
					$dbconnection.='host=127.0.0.1;';
				}
				if(!empty($config['dbport'])) {
					$dbconnection.='port='.$config['dbport'].';';
				}
			}else{
				$dbconnection=$config['dbconnection'];
			}
		}else{
			$dbconnection='mysql:';
			if(!empty($dbname)) {
				$dbconnection.='dbname='.$dbname.';';
			}
			if(!empty($dbhost)) {
				$dbconnection.='host='.$host.';';
			}else{
				$dbconnection.='host=127.0.0.1;';
			}
			$config['dbuser']=$user;
			$config['dbpass']=$pass;
		}

		try{
			parent::__construct($dbconnection,$config['dbuser'],$config['dbpass']);
		}catch(PDOException $e) {
			throw new Exception('This site has not yet become active (invalid database connection)');
			//echo 'Connection failed: '.$e->getMessage(); // still requiers some kind of error handling
			//echo '<br>'.$dbconnection;
			die();
		}
		$this->setAttribute(PDO::MYSQL_ATTR_USE_BUFFERED_QUERY,true);
		$this->setAttribute( PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION );
	}

	static function get_instance() {
		if(isset(self::$handle) && !self::$loaded) {
			$t=new self();
			if($t->is_table('config_values')) {
				$c=config::get_instance();
				$c->load_db();
				self::$loaded=true;
			}
		}

		return isset(self::$handle) ? self::$handle : self::$handle=new self();
	}

	static function get_config_instance() {
		return isset(self::$handle) ? self::$handle :self::$handle=new self();
	}

	public function query_all($query,$input=null) {
		$stmt=$this->prepare($query);
		if($input!==null && !is_array($input)) $input=array($input);
		if(is_array($input)) {
			$stmt->execute($input);
		}else{
			$stmt->execute();
		}

		$this->lquery=$stmt->queryString;

		//var_dump($stmt->errorInfo());
		try{
			$out=$stmt->fetchAll(PDO::FETCH_ASSOC);
		}catch(PDOException $e) {
			if($e->getMessage()=='SQLSTATE[HY000]: General error') return array();
			throw new PDOException($e->getMessage());
			//$e->getMessage();
			exit;
		}
		return $out;
	}

	public function get_last_query() {
		return $this->lquery;
	}

	public function insert_array($table,$input) {
		$q='INSERT INTO `'.$table.'` (';
		$cols=array();
		foreach(array_keys($input) as $a) {
			$cols[]='`'.str_replace('`','',$a).'`';
		}
		$q.=implode(',',$cols).') VALUES (';
		for($i=0;$i<count($input);$i++) {
			$q.='?';
			if($i<(count($input)-1)) $q.=',';
		}
		$q.=')';
		$stmt=$this->prepare($q);
		$stmt->execute(array_values($input));
		$this->lquery=$stmt->queryString;
		$err=$stmt->errorInfo();
		//var_dump($err);
		return $this->lastInsertId();
	}

	public function update_array($table,$input,$where) {
		$q='UPDATE `'.$table.'` set ';
		$set=array();
		$vals=array();
		foreach($input as $k=>$v) {
			$set[]='`'.$k.'`=:'.$k;
			$key=':'.$k;
			$vals[$key]=$v;
		}
		$set=implode(', ',$set);
		$wk=array_keys($where);
		$q.=$set.' WHERE `'.$wk[0].'`=:wherekey';
		$vals[':wherekey']=$where[$wk[0]];
		$dbs=$this->prepare($q);
		$dbs->execute($vals);
		$this->lquery=$dbs->queryString;
	}

	public function del($table,$id,$idcol=null,$where=null) {
		if($idcol===null) $idcol='id';
		$search=array($id);
		if(is_array($where)) {
			$wc=array_keys($where);
			$w=' AND '.$wc[0].'=?';
			$search[]=$where[$wc[0]];
		}else{
			$w=null;
		}
		$this->query_all('DELETE FROM `'.$table.'` WHERE `'.$idcol.'`=?'.$w,$search);
	}

	public function call($proc) {
		$args=func_get_args();
		$na=func_num_args()-1;
		$q='CALL '.$proc.'(';
		if($na && is_array($args[1])) {
			$q.=implode(',',array_fill(0,count($args[1]),'?'));
			$args=array_values($args[1]);
		}elseif($na) {
			$q.=implode(',',array_fill(0,$na,'?'));
			unset($args[0]);
			$args=array_values($args);
		}else{
			$args=NULL;
		}
		$q.=');';
		
		if(isset($_SERVER['WINDIR'])) {
			$db=new self();
			$dbs=$db->prepare($q);
		}else{
			$dbs=$this->prepare($q);
		}
		$dbs->execute($args);
		$this->lquery=$dbs->queryString;
		return $dbs->fetchAll(PDO::FETCH_ASSOC);
	}
	
	public function get_tables() {
		if(isset(self::$cache[md5('show tables')])) return self::$cache[md5('show tables')];
		$out=array();
		//if(count($out)) return $out;
		$tmp=$this->query_all('show tables');
		foreach($tmp as $a) {
			foreach($a as $b) {
				$out[]=$b;
			}
		}
		self::$cache[md5('show tables')]=$out;
		return $out;
	}

	public function is_table($table) {
		$tables=$this->get_tables();
		return in_array($table,$tables);
	}
	
	public function get_cols($table) {
		$tmp=$this->query_all('describe '.$table);
		$out=Array();
		foreach($tmp as $a) {
			$out[]=$a['Field'];
		}
		return $out;
	}

	public function id_exists($table,$id,$idcol=null) {
		if($idcol===null) $idcol='id';
		$cols=$this->get_cols($table);
		$c=$cols[0];
		$tmp=$this->query_all('SELECT `'.$c.'` FROM `'.$table.'` WHERE `'.$idcol.'`=?',array($id));
		if(count($tmp)) return true;
		return false;
	}
	
	public function prepare($query,$options=array()) {
		self::$queries[]=$query;
		return parent::prepare($query,$options);
	}
	
	public function __destruct() {
		//$this->insert_array('error_log',array('error'=>implode("\n",self::$queries)));
	}
}
?>
