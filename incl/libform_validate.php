<?php

/**
 * Project: Music Awards
 * Date: 8/4/2008
 */

class form_validate{
	
	private $field = array();
	private $error = array();
	
	public function __construct(){
		
	}
	
	public function add_error($field, $msg){
		if(isset($this->field[$field]['hide_error'])) return false;
		$this->error[$field] = $msg;
	}	
	
	public function add_field($field, $value){
		$this->field[$field]['value'] = $value;
	}
	
	public function add_field_all($fields){
		foreach($fields as $field=>$value){
			$this->field[$field]['value'] = $value;	
		}
	}
	
	public function add_validator($field, $validator, $params = array()){
		if(!is_array($params)) $params = array($params);
		if(is_array($validator) && count($validator)){
			foreach($validator as $v){
				$this->field[$field]['method'][$v] = $params;
			}
		}else{
			$this->field[$field]['method'][$validator] = $params;
		}
		
	}
	
	public function add_validator_all($validator, $params = array(), $fields = false){
		if(is_array($fields) && count($fields)){
			foreach($fields as $field){
				$this->add_validator($field, $validator, $params);
			}
		}else{
			foreach($this->field as $field=>$f){
				$this->add_validator($field, $validator, $params);
			}		
		}
	}
	
	public function hide_error($field){
		if(is_array($field) && count($field)){
			foreach($field as $f){
				$this->field[$f]['hide_error'] = true;
			}
		}else{
			$this->field[$field]['hide_error'] = true;
		}
	}
	
	
	public function remove_validator($field, $validator){
		if(!isset($this->field['method'][$validator])) return false;
		unset($this->field[$field]['method'][$validator]);
		return true;
	}
	
	public function remove_validator_all($validator, $fields = false){
		if(is_array($fields) && count($fields)){
			foreach($fields as $field){
				$this->remove_validator($field, $validator);
			}
		}else{
			foreach($this->field as $field=>$f){
				$this->remove_validator($field, $validator);
			}		
		}
	}
	
	
	public function validate(){
		foreach($this->field as $field=>$f){
			if(!isset($f['method'])) continue;
			foreach($f['method'] as $method=>$params){
				$this->do_method($field, $method, $params);
			}
		}
		if(count($this->error)) return $this->error;
	}
	
	public function do_method($field, $method, $params = array()){
			switch($method){
				case 'email': $this->validate_email($field, $params);
					break;
				case 'length': $this->validate_length($field, $params);
					break;
				case 'set': $this->validate_set($field, $params);
					break;			
				case 'match': $this->validate_match($field, $params);
					break;
				case 'username': $this->validate_username($field, $params);
					break;
			}	
	}
	
	private function validate_match($field, $params){
		if(!isset($params['match'])) return false;
		if($this->field[$field]['value'] != $params['match']){
			if(isset($params['error'])){
				$this->add_error($field, $params['error']);
			}else{
				$this->add_error($field, 'Please ensure '.$field.' matches');
			}
			return false;
		}
		return true;
	}
	
	private function validate_username($field, $params){
		$db = PDOclass::get_instance();
		if(!eregi('^[a-zA-Z0-9_-]{5,16}$', $this->field[$field]['value'])){
			if(isset($params['error'])){
				$this->add_error($field, $params['error']);
			}else{
				$this->add_error($field, 'Please enter a valid username');	
			}
			return false;
		}
		if(count($db->query_all("SELECT * FROM `auth_users` WHERE username = ?", array($this->field[$field]['value'])))){
			if(isset($params['error'])){
				$this->add_error($field, $params['error']);
			}else{
				$this->add_error($field, 'Username supplied is already in use by another user');	
			}
			return false;
		}	
		return true;
	}
	
	private function validate_email($field, $params){
		$db = PDOclass::get_instance();
		if(!eregi('^[a-zA-Z0-9._-]+@[a-zA-Z0-9-]+\.[a-zA-Z.]{2,5}$', $this->field[$field]['value'])){
			if(isset($params['error'])){
				$this->add_error($field, $params['error']);
			}else{
				$this->add_error($field, 'Please enter a valid email');	
			}
			return false;
		}
		if(count($db->query_all("SELECT * FROM `auth_users` WHERE email = ?", array($this->field[$field]['value'])))){
			if(isset($params['error'])){
				$this->add_error($field, $params['error']);
			}else{
				$this->add_error($field, 'Email address supplied is already in use by another user');	
			}
			return false;
		}	
		return true;
	}
	
	private function validate_length($field, $params){
		if(isset($params['length'])){
			if(strlen($this->field[$field]['value']) != $params['length']){
				if(isset($params['error'])){
					$this->add_error($field, $params['error']);
				}else{
					$this->add_error($field, 'Please enter a valid '.$params['length'].' character '.$field);
				}
				return false;
			}
		}else{
			if(!isset($params['min'])) $params['min'] = 1;
			if(!isset($params['max'])) $params['max'] = 16;
			if(strlen($this->field[$field]['value']) > $params['max'] || strlen($this->field[$field]['value']) < $params['min']){
				if(isset($params['error'])){
					$this->add_error($field, $params['error']);
				}else{
					$this->add_error($field, 'Please enter a valid '.$field.' between '.$params['min'].' and '.$params['max'].' characters');
				}
				return false;
			}
		}
		return true;
	}
	
	private function validate_set($field, $params){
		if(!isset($this->field[$field]['value']) || empty($this->field[$field]['value'])){
			if(isset($params['error'])){
				$this->add_error($field, $params['error']);
			}else{
				$this->add_error($field, 'Please enter a valid '. $field);
			}
			return false;
		}
		return true;
	}
}
?>