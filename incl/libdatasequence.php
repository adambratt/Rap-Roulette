<?php

class datasequence implements IteratorAggregate {

	protected $db;
	private $data=array();
	private $_meta=array();
	protected $table;
	protected $key_row='key';
	protected $value_row='value';
	protected $group_row;
	protected $group;

	public function __construct($table=null,$key=null,$value=null,$group_row=null,$group=null) {
		$this->db=PDOclass::get_instance();
		if($table!==null) $this->table=$table;
		if($key!==null) $this->key_row=$key;
		if($value!==null) $this->value_row=$value;
		if($group_row!==null) $this->group_row=$group_row;
		if($group!==null) $this->group=$group;
		$this->load();
	}

	public function load() {
		if(empty($this->db)) $this->db=PDOclass::get_instance();
		$q='SELECT * FROM `'.$this->table.'`';
		$search=array();
		if(!empty($this->group_row)) {
			$q.=' WHERE `'.$this->group_row.'`=?';
			$search[]=$this->group;
		}
		$tmp=$this->db->query_all($q,$search);
		foreach($tmp as $a) {
			$this->data[$a[$this->key_row]]=$a[$this->value_row];
			$this->_meta[$a[$this->key_row]]=$a;
		}
	}

	public function __get($key) {
		switch($key) {
			case 'meta':
				return $this->_meta;
		}
		return (isset($this->data[$key])) ? $this->data[$key] : null;
	}

	public function __set($key,$value) {
		if(!isset($this->data[$key])) {
			$vals=array();
			$vals[$this->key_row]=$key;
			$vals[$this->value_row]=$value;
			if(!empty($this->group_row)) $vals[$this->group_row]=$this->group;
			$this->db->insert_array($this->table,$vals);
			$this->data[$key]=$value;
			return;
		}
		$q='UPDATE `'.$this->table.'` SET `'.$this->value_row.'`=? WHERE `'.$this->key_row.'`=?';
		$search=array($value,$key);
		if(!empty($this->group_row)) {
			$q.=' AND `'.$this->group_row.'`=?';
			$search[]=$this->group;
		}
		$this->db->query_all($q,$search);
		$this->data[$key]=$value;
	}

	public function __isset($key) {
		return isset($this->data[$key]);
	}

	public function __unset($key) {
		if(!isset($this->data[$key])) return;
		$q='DELETE FROM `'.$this->table.'` WHERE `'.$this->key_row.'`=?';
		$search=array($key);
		if(!empty($this->group_row)) {
			$q.=' AND `'.$this->group_row.'`=?';
			$search[]=$this->group;
		}
		$this->db->query_all($q,$search);
		unset($this->data[$key]);
	}

	public function getIterator() {
		return new ArrayIterator($this->data);
		//return $obj->getIterator();
	}
}
?>
