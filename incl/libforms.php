<?php

class forms {

	public function __construct() {/*{{{*/
	}/*}}}*/

	static public function minmax(&$input, $min, $max) {/*{{{*/
		$input=(int)$input;
		if($input > $max) {
			$input=$max;
		}elseif($input<$min) {
			$input=$min;
		}
	}/*}}}*/

	static public function commit($table,$data,$test=null) {/*{{{*/
		if(!is_array($data)) return;
		$db=PDOclass::get_instance();
		if(!$db->is_table($table)) throw new Exception('Error: Form does not exist');
		$cols=$db->get_cols($table);
		$data=self::filter($cols,$data);
		$horiz=false;
		foreach($data as $a) {
			if(is_array($a)) $horiz=true;
		}
		if($horiz) {
			$i=0;
			$input=array();
			foreach($data as $a=>$v) {
				if(!is_array($v)) continue;
				$i=0;
				foreach($v as $b) {
					$input[$i][$a]=$b;
					$i++;
				}
			}
		}

		//self::dumpit($input);
		if(is_array($test)) {
			$col=array_keys($test);
			$col=$col[0];
			$tmp=$db->query_all('SELECT * FROM `'.$table.'` WHERE '.$col.'=?',array($test[$col]));
		}else{
			$tmp=array();
		}
		if($horiz) {
			for($i=0;$i<count($input);$i++) {
				if(isset($tmp[$i])) {
					$db->update_array($table,$input[$i],array('id'=>$tmp[$i]['id']));
				}else{
					$db->insert_array($table,$input[$i]);
				}
			}
		}else{
			if(count($tmp)) {
				$db->update_array($table,$data,$test);
			}else{
				$db->insert_array($table,$data);
			}
		}
	}/*}}}*/

	static public function filter($cols,$data) {/*{{{*/
		$out=Array();
		foreach($data as $k=>$v) {
			if(in_array($k,$cols)) $out[$k]=$v;
		}
		return $out;
	}/*}}}*/
	
	static public function db_form($table,$ignore=Array(),$rows=0) {/*{{{*/
		$db=PDOclass::get_instance();
		if(!$db->is_table($table)) return false; 
		
		$cols=$db->get_cols($table);

		$schema=forms::get_schema($table);

		$out=array();
		$out['fields']=array();
		if($rows) {
			$out['values']=range(0,$rows-1);
		}
		foreach($cols as $a) {
			if(in_array($a,$ignore)) continue;
			$i=count($out['fields']);
			$out['fields'][$i]['field']=$a;
			if(isset($schema[$a])) {
				if(!empty($schema[$a]['name'])) {
					$out['fields'][$i]['label']=$schema[$a]['name'];
				}else{
					$out['fields'][$i]['label']=ucwords(str_replace('_',' ',$a));
				}
				$out['fields'][$i]['type']=$schema[$a]['type'];
				$opts=@unserialize($schema[$a]['options']);
				if($opts!=='false') $out['fields'][$i]['options']=$schema[$a]['options'];
			}else{
				$out['fields'][$i]['label']=ucwords(str_replace('_',' ',$a));
			}
		}

		//var_dump($out);

		return $out;
	}/*}}}*/

	static public function get_schema($table) {/*{{{*/
		$db=PDOclass::get_instance();
		$schema=$db->query_all('SELECT s.* FROM `forms_forms` f LEFT JOIN `forms_schemas` s ON f.id=s.form_id WHERE f.form_name=?',array($table));
		if(!is_array($schema) || !count($schema)) return array();
		$out=array();
		foreach($schema as $a) {
			$out[$a['col']]=$a;
		}
		return $out;
	}/*}}}*/

	static function quick_form($table,$idfield,$id,$type='v',$ignore=array('id')) {/*{{{*/
		$smarty=smartyex::get_instance();
		$out=NULL;
		$db=PDOclass::get_instance();
		$schema=forms::get_schema($table);
		if(!empty($schema)) {
		}

		// Handle incoming data/*{{{*/
		if(count($_POST) && !empty($_POST['method']) && $_POST['method']=='mkform') {
			if(!isset($_POST['group']) || $_POST['group']!==$table) {
				throw new Exception('The form you are looking for does not exist');
			}
			if($type=='h') {
				$_POST[$idfield]=array_fill(0,5,$id);
			}else{
				$_POST[$idfield]=$id;
			}
			forms::commit($_POST['group'],$_POST,array($idfield=>$id));
			$out.='<p>Your data has been updated</p>';
		}
		// End incoming data/*}}}*/

		$datain=$db->query_all('SELECT * FROM `'.$table.'` WHERE `'.$idfield.'`=?',array($id));
		//forms::dumpit($datain);
		if(is_array($datain) && count($datain)) {
			if($type=='h') {
				$smarty->assign('datain',$datain);
			}else{
				$smarty->assign('datain',$datain[0]);
			}
		}else{
			//throw new Exception('SELECT * FROM `'.$table.'` WHERE `'.$idfield.'`=?');
		}
		$form='forms_form'.$type;
		// Create the form
		$rows=0;
		if($type=='h') $rows=5;
		$input=forms::db_form($table,array($idfield,$id,'id','uid'),$rows);
		
		$input['heading']='Personal';
		$input['group']=$table;
		$smarty->assign('input',$input);
		// End create the form
		$out.=$smarty->fetch('mod:'.$form.'.html');
		return $out;
	}/*}}}*/

	static public function dumpit($in) {/*{{{*/
		echo '<pre>';
		var_dump($in);
		echo '</pre>';
		exit;
	}/*}}}*/

	static public function scan_float($in) {
		if(!strlen($in)) return 0;
		$out=null;
		$hasdec=false;
		for($i=0;$i<strlen($in);$i++) {
			$t=substr($in,$i,1);
			if($t=='.') {
				if($hasdec) continue;
				$out.='.';
				continue;
			}
			if(!is_numeric($t)) continue;
			if($t=='e') continue;
			$out.=$t;
		}

		return (float)$out;
	}

	static public function validate($in,$type,$data,$message) {
		switch($type) {
			case 'email':
			self::validate($in,'regex','/[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,4}/',$message);
			break;

			case 'minlength':
			$len=(int)$data;
			$s=null;
			if($len!=1) $s='s';
			if(strlen($in)<$len) throw new Exception($message);
			break;

			case 'maxlength':
			$len=(int)$data;
			if(strlen($in)>$len) throw new Exception($message);
			break;

			case 'regex':
			$matches=array();
			$cnt=preg_match($data,$in,$matches);
			if($cnt==0 || $matches[0]!=$in) throw new Exception($message);
			break;
		}
	}
}
?>
