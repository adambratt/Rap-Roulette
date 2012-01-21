<?php

class dataset {

	private $data=array();
	public $row=array();
	private $db;
	protected $rowobj='datarow';
	protected $table;
	protected $keyrow='key';
	protected $valuerow='value';
	private $indexdata=null;

	public function __construct($table=null,$where=null,$search=null,$dataobj=null) {
		if($dataobj!==null) $this->rowobj=$dataobj;
		//$this->db=PDOclass::get_instance();
		$this->table=$table;
		if($table!==null) $this->load($table,$where,$search);
	}

	public function add($obj) {
	}
	
	public function search($key,$value) {
		foreach($this->row as $a) {
			if($a->$key==$value) return $a;
		}
		return false;
	}

	public function load($table,$where=null,$s=null) {
		$this->db=PDOclass::get_instance();
		if(is_string($where)) {
			$q=$where;
			$search=$s;
		}else{
			$q='SELECT * FROM `'.$table.'`';
			$w=array();
			$search=null;
			if(is_array($where)) {
				foreach($where as $k=>$v) {
					$w[]=' `'.$k.'`= ? ';
				}
				$w=' WHERE '.implode('AND',$w);
				$search=array_values($where);
			}else{
				$w=null;
			}
			$q.=$w;
		}
		$tmp=$this->db->query_all($q,$search);
		if(!count($tmp)) return;
		$rowobj=$this->rowobj;
		$this->row=array();
		foreach($tmp as $a) {
			$i=count($this->row);
			$this->row[$i]=new $rowobj();
			$this->row[$i]->set_table($table);
			$this->row[$i]->set_data($a);
		}
		$this->index();
	}

	public function asXML() {
		$obj=new DOMDocument('1.0');
		$obj->formatOutput = true;
		$root=$obj->createElement('dataset');
		$obj->appendChild($root);
		$root->setAttribute('table',$this->table);
		$root->setAttribute('rowobj',$this->rowobj);
		foreach($this->row as $a) {
			$row=$obj->createElement('row');
			$b=$a->as_array();
			foreach($b as $k=>$v) {
				$col=$obj->createElement($k,$v);
				$row->appendChild($col);
			}
			$rowob=$root->appendChild($row);
		}

		return $obj->saveXML();
	}

	public function fromXML($xml) {
		$doc = new DOMDocument();
		$doc->loadXML($xml);
		$table = $doc->getElementsByTagName('dataset');
		for($i=0;$i<$table->length; $i++) {
			foreach($table->item($i)->attributes as $a) {
				if($a->name == 'table') $this->table=$a->value;
				if($a->name == 'rowobj') $this->rowobj=$a->value;
			}
			$rows=$table->item($i)->getElementsByTagName('row');
			$rowobj=$this->rowobj;
			foreach($rows as $a) {
				if(!$a->hasChildNodes()) continue;
				$keys=$a->childNodes;
				$i=count($this->row);
				$this->row[$i]=new $rowobj();
				$this->row[$i]->set_table($this->table);
				$data=array();
				foreach($keys as $b) {
					if(!strlen($b->localName)) continue;
					$data[$b->localName]=$b->nodeValue;
				}
				$this->row[$i]->set_data($data);
			}
		}
	}
	
	public function set_key($key) {
		$this->keyrow=$key;
	}

	public function set_value($value) {
		$this->valuerow=$value;
	}

	public function __get($key) {
		if(!is_array($this->indexdata)) $this->index();
		$val=$this->valuerow;
		if($key=='_keys') return array_keys($this->indexdata);
		return (isset($this->indexdata[$key])) ? $this->indexdata[$key]->value : null;
	}

	public function __set($key,$value) {
		if(!is_array($this->indexdata)) $this->index();
		$val=$this->valuerow;
		if(!isset($this->indexdata[$key])) return;
		$this->indexdata[$key]->$val=$value;
	}

	protected function index() {
		$key=$this->keyrow;
		$this->indexdata=array();
		foreach($this->row as &$a) {
			$this->indexdata[$a->$key]=$a;
		}
	}
}
?>
