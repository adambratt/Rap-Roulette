<?php

class datarow {

	protected $table;
	protected $db;
	protected $data;
	protected $id;
	protected $loaded;
	protected $cols;
	private $join_table;
	private $join_on=array();
	private $ro=false;
	protected $dirty=array();
	static $schemas=array();

	public function __construct($id=null, $table=null) {
		$this->db=PDOclass::get_instance();
		$this->table=$table;
		if($id!==null) $this->load($id);
		return $this;
	}

	public function set_table($table) {
		$this->table=$table;
	}

	public function load($id) {
		if(empty($this->db)) $this->db=PDOclass::get_instance();
		if($this->join_table) {
			$q='SELECT * FROM `'.$this->table.'` `a` LEFT JOIN `'.$this->join_table.'` `b` ON a.'.$this->join_on[0].'=b.'.$this->join_on[1].' WHERE a.id=?';
		}else{
			$q='SELECT * FROM `'.$this->table.'` WHERE `id`=?';
		}
		$tmp=$this->db->query_all($q,array($id));
		if(!count($tmp)) return false;
		$this->data=$tmp[0];
		$this->id=$tmp[0]['id'];
		$this->cols=self::get_schema($this->table);
		$this->loaded=true;
		return true;
	}

	public function set_join($table,$scol,$tcol) {
		if(!$this->db->table_exists($table)) return;
		$cols=self::get_schema($table);
		if(!in_array($tcol,$cols)) return;
		$this->join_table=$table;
		$this->join_on=array($scol,$tcol);
	}

	public function set_ro($ro=true) {
		$this->ro=(bool)$ro;
	}

	public function set_data($data) {
		if(!$this->db) $this->db=PDOclass::get_instance();
		$this->cols=self::get_schema($this->table);
		//$data=forms::filter($this->cols,$data);
		$this->data=$data;
		$this->loaded=true;
		$this->id=$data['id'];
	}
	
	public function unload() {
		$this->id=null;
		$this->data=null;
		$this->loaded=false;
	}

	public function get_all($where=null,$sort=null,$sortdir=null) {
		$search=null;
		if(is_array($where)) {
			$w=array();
			foreach($where as $k=>$v) {
				$w[]='`'.$k.'`=:'.$k;
			}
			$search=$where;
			$where=' WHERE '.implode(' AND ',$w);
		}
		$order=null;
		if($sort!==NULL) {
			$order=' ORDER BY `'.$sort.'`';
			if($sortdir!==NULL) $order.=' '.$sortdir;
		}
		$tmp=$this->db->query_all('SELECT * FROM `'.$this->table.'`'.$where.$order,$search);
		return $tmp;
	}

	public function create($data) {
		$this->db=PDOclass::get_instance();
		//$data=forms::filter(self::get_schema($this->table),$data);
		if(isset($data['id'])) unset($data['id']);
		$id=$this->db->insert_array($this->table,array());
		//$class=get_class($this);
		$this->load($id);
		foreach($data as $k=>$v) {
			$this->$k=$v;
		}
		//return $obj;
	}
	
	public function update($data,$autocreate=true) {
		if(!$this->is_loaded() && !$autocreate) return;
		if(!$this->is_loaded()) {
			$this->create(array());
		}
		foreach($data as $k=>$v) {
			if($k=='id') continue;
			$this->$k=$v;
		}
	}
	
	public function listen($autocreate=false) {
		if(!count($_POST)) return false;
		$this->update($_POST,$autocreate);
		return true;
	}

	public function remove() {
		if(!$this->loaded) return;
		$this->db->del($this->table,$this->id);
		$this->unload();
	}

	public function search($key,$value) {
		/**
		 * Find a row with column ($key) equal to $value
		 * This method is chainable, so you could call $obj->search('key','value')->is_loaded();
		 * to check if a row was actually found
		 */
		if(!$this->db) $this->db=PDOclass::get_instance();
		$tmp=$this->db->query_all('SELECT * FROM `'.$this->table.'` WHERE `'.$key.'`=?',array($value));
		if(!count($tmp)) return $this;
		$this->load($tmp[0]['id']);
		return $this;
	}

	public function search_multiple($data) {
		if(!$this->db) $this->db=PDOclass::get_instance();
		$where=' WHERE ';
		$w=array();
		foreach($data as $k=>$v) {
			$w[]='`'.$k.'`=:'.$k;
		}
		$where.=implode(' AND',$w);
		$tmp=$this->db->query_all('SELECT * FROM `'.$this->table.'`'.$where,$data);
		if(!count($tmp)) return $this;
		$this->load($tmp[0]['id']);
		return $this;
	}
	
	public function is_loaded() {
		return $this->loaded;
	}

	public function as_array() {
		return $this->data;
	}

	public function __get($key) {
		if(!$this->loaded) return null;
		return isset($this->data[$key]) ? $this->data[$key] : null;
	}

	public function __set($key,$value) {
		if(!$this->loaded) return null;
		if($this->ro) return; // Don't change anything if we are read only
		if($key=='id') return;
		$keys=array_keys($this->data);
		if(!in_array($key,$keys)) return;
		if(!in_array($key,$this->dirty) && $this->data[$key]!==$value) $this->dirty[]=$key;
		//$this->db->update_array($this->table,array($key=>$value),array('id'=>$this->id)); // Now uses commit on destruct.
		$this->data[$key]=$value;
	}
	
	public function commit() {
		if(!count($this->dirty)) return;
		$out=array();
		foreach($this->dirty as $a) {
			if(!isset($this->data[$a])) continue;
			$out[$a]=$this->data[$a];
		}
		$this->db->update_array($this->table,$out,array('id'=>$this->id));
	}

	public function __destruct() {
		$this->commit();
	}
	
	static public function get_schema($table) {
		if(isset(self::$schemas[$table])) return self::$schemas[$table];
		$mod=substr($table,0,strpos($table,'_'));
		if(!file_exists(CWD.'/modules/'.$mod.'/sqlschema.xml')) {
			self::$schemas[$table]=array();
			return array();
		}
		$xml=simplexml_load_file(CWD.'/modules/'.$mod.'/sqlschema.xml');
		foreach($xml->columns as $a) {
			$tmptbl=(string)$a['name'];
			if(!isset(self::$schemas[$tmptbl])) self::$schemas[$table]=array();
			foreach($a->column as $b) {
				self::$schemas[$tmptbl][]=(string)$b->Field;
			}
			break;
		}
		if(!isset(self::$schemas[$table])) {
			self::$schemas[$table]=array();
			return array();
		}
		return self::$schemas[$table];
	}
}
?>
