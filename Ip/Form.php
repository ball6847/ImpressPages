<?php
/**
 * @package ImpressPages
 *
 */

namespace Ip;


class Form
{
    const METHOD_POST = 'post';
    const METHOD_GET = 'get';
    const ENVIRONMENT_ADMIN = 'admin';
    const ENVIRONMENT_PUBLIC = 'public';


    /**
     * @var Form\Fieldset[]
     */
    protected $fieldsets;
    protected $method;
    protected $action;
    protected $attributes;
    protected $classes;
    protected $environment;

    public function __construct()
    {
        $this->fieldsets = array();
        $this->method = self::METHOD_POST;
        $this->action = \Ip\Internal\UrlHelper::getCurrentUrl();
        $this->attributes = array();
        $this->classes = array('ipModuleForm' => 1, 'ipsModuleForm' => 1);
        if (ipRequest()->getControllerType() == \Ip\Request::CONTROLLER_TYPE_ADMIN) {
            $this->setEnvironment(self::ENVIRONMENT_ADMIN);
        } else {
            $this->setEnvironment(self::ENVIRONMENT_PUBLIC);
        }


        $this->addCsrfCheck();
    }

    /**
     * Set form environment. Depending on that public or admin translations and layout will be chosen.
     * ImpressPages tries to detect environment automatically based on current controller. You can set manually the right mode if needed.
     * @param $environment
     */
    public function setEnvironment($environment)
    {
        $this->environment = $environment;
    }

    public function getEnvironment()
    {
        return $this->environment;
    }

    /**
     * Add securityToken field
     */
    public function addCsrfCheck()
    {
        $tokenField = new \Ip\Form\Field\Csrf();
        $tokenField->setName('securityToken');
        $this->addField($tokenField);
    }

    /**
     * Remove securityToken field
     */
    public function removeCsrfCheck()
    {
        $this->removeField('securityToken');
    }

    /**
     * Remove field from fieldset
     * @param string $fieldName
     * @return int removed fields count
     */
    public function removeField($fieldName)
    {
        $count = 0;
        foreach ($this->fieldsets as $fieldset) {
            $count += $fieldset->removeField($fieldName);
        }
        return $count;
    }

    /**
     *
     * Check if data passes form validation rules
     * @param array $data - post data from user or other source.
     * @return array errors. Array key - error field name. Value - error message. Empty array means there are no errors.
     */
    public function validate($data)
    {
        $fields = $this->getFields();
        $errors = array();
        foreach ($fields as $field) {
            $error = $field->validate($data, $field->getName(), $this->getEnvironment());
            if ($error !== false) {
                $errors[$field->getValidationInputName()] = $error;
            }
        }
        return $errors;
    }

    /**
     *
     * Filter data array. Return only those records that are expected according to form field names.
     * @param array $data
     * @return array
     */
    public function filterValues($data)
    {
        $answer = array();
        $fields = $this->getFields();
        foreach ($fields as $field) {
            if (isset($data[$field->getName()])) {
                $answer[$field->getName()] = $data[$field->getName()];
            }
        }
        return $answer;
    }



    public function addFieldset($fieldset)
    {
        $this->fieldsets[] = $fieldset;
    }



    /**
     *
     * Add field to last fielset. Create fieldset if does not exist.
     * @param Form\Field $field
     */
    public function addField(\Ip\Form\Field $field)
    {
        if (count($this->fieldsets) == 0) {
            $this->addFieldset(new Form\Fieldset());
        }
        end($this->fieldsets)->addField($field);
    }





    /**
     *
     * Set post method.
     * @param string $method Use \Ip\Form::METHOD_POST or \Ip\Form::METHOD_GET
     * @throws Exception
     */
    public function setMethod($method)
    {
        switch ($method) {
            case self::METHOD_POST:
            case self::METHOD_GET:
                $this->method = $method;
                break;
            default:
                throw new Exception ('Unknown method "' . $method . '"', Exception::INCORRECT_METHOD_TYPE);
        }
    }

    /**
     * @return string
     */
    public function getMethod()
    {
        return $this->method;
    }


    /**
     * @param string $action
     */
    public function setAction($action)
    {
        $this->action = $action;
    }

    public function getAction()
    {
        return $this->action;
    }

    /**
     * @param View $view
     * @return string
     */
    public function render(\Ip\View $view = null)
    {
        if (!$view) {
            if ($this->getEnvironment() == self::ENVIRONMENT_ADMIN) {
                $view = ipView('Form/adminView/form.php');
            } else {
                $view = ipView('Form/publicView/form.php');
            }
        }
        $view->setVariables(
            array(
                'form' => $this,
                'environment' => $this->getEnvironment()
            )
        );

        $fields = $this->getFields();
        foreach($fields as $field) {
            $field->setEnvironment($this->getEnvironment());
        }

        return $view->render();
    }


    /**
     *
     * Return all fieldset
     * @return Form\Fieldset[]
     */
    public function getFieldsets()
    {
        return $this->fieldsets;
    }



    /**
     * @return Form\Field[]
     */
    public function getFields()
    {
        $fieldsets = $this->getFieldsets();
        $fields = array();
        foreach ($fieldsets as $fieldset) {
            $fields = array_merge($fields, $fieldset->getFields());
        }
        return $fields;
    }

    /**
     * @param $name
     * @return \Ip\Form\Field
     */
    public function getField($name)
    {
        $allFields = $this->getFields();
        foreach ($allFields as $key => $field) {
            if ($field->getName() == $name) {
                return $field;
            }
        }
        return false;
    }

    /**
     *
     * Add attribute to the form
     * @param string $name
     * @param string $value
     */
    public function addAttribute($name, $value)
    {
        $this->attributes[$name] = $value;
    }

    public function removeAttribute($name)
    {
        unset($this->attributes[$name]);
    }

    public function getAttributes()
    {
        return $this->attributes;
    }

    public function getAttributesStr()
    {
        $answer = '';
        foreach ($this->getAttributes() as $attributeKey => $attributeValue) {
            $answer .= ' ' . htmlspecialchars($attributeKey) . '="' . htmlspecialchars($attributeValue) . '"';
        }
        return $answer;
    }

    /**
     *
     * Add CSS class to the form
     * @param string $cssClass
     */
    public function addClass($cssClass)
    {
        $this->classes[$cssClass] = 1;
    }

    public function removeClass($cssClass)
    {
        unset($this->classes[$cssClass]);
    }

    public function getClasses()
    {
        return array_keys($this->classes);
    }

    public function getClassesStr()
    {
        $answer = '';
        foreach ($this->getClasses() as $class) {
            $answer .= ' ' . $class;
        }
        return 'class="' . $answer . '"';
    }

    public function __toString()
    {
        return $this->render();
    }


}